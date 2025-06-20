import { NextRequest, NextResponse } from 'next/server'
import { backupServices } from '@/lib/services/backup'
import { validateSession } from '@/lib/auth'
import { googleDriveService } from '@/lib/services/google-drive'
import { AuditService } from '@/lib/services/audit'

interface Member {
  id: string;
  [key: string]: any;
}

interface Contribution {
  id: string;
  memberId: string;
  [key: string]: any;
}

interface Donation {
  id: string;
  memberId?: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const member = await validateSession(token)
    if (!member || (member.trusteeRole !== 'President' && member.trusteeRole !== 'PRESIDENT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('file')

    if (!fileId) {
      return NextResponse.json({ error: 'Backup file ID not specified' }, { status: 400 })
    }

    // Download and verify the backup
    try {
      const backupContent = await googleDriveService.downloadFile(fileId)
      const backup = JSON.parse(backupContent)

      // Verify backup structure and data integrity
      const issues: string[] = []

      // Check backup structure
      if (!backup.timestamp) issues.push('Missing timestamp')
      if (!backup.version) issues.push('Missing version')

      // Check required arrays exist and are valid
      const requiredArrays = [
        'members',
        'contributions',
        'donations',
        'expenses',
        'activities',
        'activityParticipants',
        'workshopResources',
        'meetings',
        'meetingAttendees',
        'meetingDecisions',
        'meetingAttachments',
        'links',
        'sessions',
        'auditLogs'
      ]

      for (const arrayName of requiredArrays) {
        if (!Array.isArray(backup[arrayName])) {
          issues.push(`Invalid ${arrayName} data: not an array`)
  }
      }

      // Check relationships
      const memberIds = new Set((backup.members as Member[])?.map(m => m.id) || [])

      // Check contributions
      for (const contribution of (backup.contributions as Contribution[]) || []) {
        if (!memberIds.has(contribution.memberId)) {
          issues.push(`Invalid member reference in contribution: ${contribution.id}`)
        }
      }

      // Check donations
      for (const donation of (backup.donations as Donation[]) || []) {
        if (donation.memberId && !memberIds.has(donation.memberId)) {
          issues.push(`Donation ${donation.id} references non-existent member`)
        }
    }

      // Log the verification attempt
      await AuditService.log({
        action: 'UPDATE',
        entityType: 'backup',
        entityId: fileId,
        memberId: member.id,
        summary: `Verified backup file${issues.length > 0 ? ' with issues' : ' successfully'}`,
        changes: { issues }
      })

      return NextResponse.json({
        isValid: issues.length === 0,
        issues
      })
    } catch (error) {
      console.error('Error parsing backup file:', error)
      return NextResponse.json({
        isValid: false,
        issues: ['Failed to parse backup file. The file may be corrupted.']
      })
    }
  } catch (error) {
    console.error('Error verifying backup:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify backup' },
      { status: 500 }
    )
  }
} 