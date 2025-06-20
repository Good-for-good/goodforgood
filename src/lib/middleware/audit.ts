import { Prisma } from '@prisma/client'
import { AuditService } from '../services/audit'
import { getSession } from '../session'

const excludedModels = ['Session', 'AuditLog'] // Models we don't want to audit
const excludedActions = ['findMany', 'findFirst', 'findUnique', 'count'] // Read operations we don't want to audit

export async function auditMiddleware(
  params: any,
  next: (params: any) => Promise<any>
) {
  try {
    // Check if this is a manual operation (set by the application code)
    const isManualOperation = params._isManual === true;
    if (isManualOperation) {
      AuditService.startManualOperation();
    } else {
      // Start a new group if this is a write operation and no group exists
      const isWrite = !excludedActions.includes(params.action);
      if (isWrite && !AuditService.getCurrentGroupId()) {
        AuditService.startNewGroup();
      }
    }

    const result = await next(params)

    // Don't audit read operations or excluded models
    if (excludedActions.includes(params.action) || excludedModels.includes(params.model || '')) {
      return result
    }

    try {
      const session = await getSession()
      if (!session?.memberId) {
        return result
      }

      // Map Prisma actions to audit actions
      const actionMap = {
        create: 'CREATE',
        update: 'UPDATE',
        delete: 'DELETE',
        upsert: 'UPDATE',
      } as const

      const action = actionMap[params.action as keyof typeof actionMap]
      if (!action || !params.model) {
        return result
      }

      // For create operations
      if (action === 'CREATE' && result) {
        await AuditService.log({
          action,
          entityType: params.model,
          entityId: result.id,
          memberId: session.memberId,
          changes: { new: result },
        }).catch(error => {
          console.error('Failed to create audit log:', error)
        })
      }

      // For update operations
      if (action === 'UPDATE' && result) {
        await AuditService.log({
          action,
          entityType: params.model,
          entityId: result.id,
          memberId: session.memberId,
          changes: {
            old: params.args?.where,
            new: params.args?.data,
          },
        }).catch(error => {
          console.error('Failed to create audit log:', error)
        })
      }

      // For delete operations
      if (action === 'DELETE' && result) {
        await AuditService.log({
          action,
          entityType: params.model,
          entityId: result.id,
          memberId: session.memberId,
          changes: { old: result },
        }).catch(error => {
          console.error('Failed to create audit log:', error)
        })
      }

      // End the group or manual operation if this was the last operation in a transaction
      if (params.action === 'commit' || !params._transaction) {
        if (isManualOperation) {
          AuditService.endManualOperation();
        } else {
          AuditService.endGroup();
        }
      }
    } catch (error) {
      console.error('Error in audit middleware:', error)
    }

    return result
  } catch (error) {
    console.error('Error in audit middleware:', error)
    return next(params)
  }
} 