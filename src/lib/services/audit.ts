import { prisma } from '../db';
import { AuditLog, Prisma } from '@prisma/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Prisma.InputJsonValue;
  memberId: string;
  groupId?: string;
  parentId?: string;
  summary?: string;
}

interface GroupedAuditLog {
  id: string;
  groupId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string | null;
  changes: Prisma.JsonValue;
  memberId: string;
  member: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

export class AuditService {
  private static currentGroupId: string | null = null;
  private static isManualOperation = false;

  static startNewGroup() {
    this.currentGroupId = crypto.randomUUID();
  }

  static startManualOperation() {
    this.isManualOperation = true;
  }

  static endManualOperation() {
    this.isManualOperation = false;
  }

  static endGroup() {
    this.currentGroupId = null;
  }

  static getCurrentGroupId() {
    return this.currentGroupId;
  }

  static async log(entry: AuditLogEntry): Promise<AuditLog> {
    try {
      // For manual operations, don't use groupId
      const groupId = this.isManualOperation ? undefined : (entry.groupId || this.currentGroupId || undefined);

      // Generate a summary based on the action and entity type
      const summary = entry.summary || this.generateSummary(entry);

      const data: Prisma.AuditLogCreateInput = {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: entry.changes ?? Prisma.JsonNull,
        member: { connect: { id: entry.memberId } },
        groupId,
        parentId: entry.parentId,
        summary,
      };

      return await prisma.auditLog.create({
        data,
        include: {
          member: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  private static generateSummary(entry: AuditLogEntry): string {
    const action = entry.action.toLowerCase();
    const entityType = entry.entityType.toLowerCase();
    
    // Handle special cases
    switch (entityType) {
      case 'donation':
        const amount = (entry.changes as any)?.new?.amount;
        return amount ? `${action}d donation of $${amount}` : `${action}d donation`;
      case 'expense':
        const expenseAmount = (entry.changes as any)?.new?.amount;
        return expenseAmount ? `${action}d expense of $${expenseAmount}` : `${action}d expense`;
      default:
        return `${action}d ${entityType}`;
    }
  }

  static async getGroupedLogs(limit: number = 50): Promise<GroupedAuditLog[]> {
    // First get the latest log from each group
    const groupedLogs = await prisma.$queryRaw<GroupedAuditLog[]>`
      WITH RankedLogs AS (
        SELECT 
          al.*,
          m.name as member_name,
          m.email as member_email,
          ROW_NUMBER() OVER (PARTITION BY COALESCE(al."groupId", al.id) ORDER BY al."createdAt" DESC) as rn
        FROM audit_logs al
        LEFT JOIN members m ON al."memberId" = m.id
      )
      SELECT 
        id,
        "groupId",
        action,
        "entityType",
        "entityId",
        summary,
        changes,
        "memberId",
        json_build_object('name', member_name, 'email', member_email) as member,
        "createdAt"
      FROM RankedLogs
      WHERE rn = 1
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;

    return groupedLogs;
  }

  static async getLogDetails(groupId: string): Promise<AuditLog[]> {
    const where: Prisma.AuditLogWhereInput = {
      OR: [
        { groupId },
        { id: groupId }
      ]
    };

    return prisma.auditLog.findMany({
      where,
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async getLogsForEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const where: Prisma.AuditLogWhereInput = {
      entityType,
      entityId,
    };

    return prisma.auditLog.findMany({
      where,
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getRecentLogs(
    options: { 
      limit?: number;
      offset?: number;
      entityType?: string;
      entityId?: string;
      action?: string;
      search?: string;
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const { limit = 50, offset = 0, entityType, entityId, action, search } = options;

    const where: Prisma.AuditLogWhereInput = {
      AND: [
        {
          ...(entityType && { entityType }),
          ...(entityId && { entityId }),
          ...(action && { action }),
        },
        ...(search ? [{
          OR: [
            { 
              member: { 
                name: { 
                  contains: search, 
                  mode: Prisma.QueryMode.insensitive 
                } 
              } 
            },
            { 
              member: { 
                email: { 
                  contains: search, 
                  mode: Prisma.QueryMode.insensitive 
                } 
              } 
            },
            { 
              entityType: { 
                contains: search, 
                mode: Prisma.QueryMode.insensitive 
              } 
            }
          ]
        }] : [])
      ]
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
      take: limit,
        skip: offset,
        where,
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  }
} 
 
 