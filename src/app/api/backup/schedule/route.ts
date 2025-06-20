import { NextRequest, NextResponse } from 'next/server'
import { backupServices } from '@/lib/services/backup'
import { validateSession } from '@/lib/auth'
import { AuditService } from '@/lib/services/audit'

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

    const schedule = await backupServices.getBackupSchedule()
    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error fetching backup schedule:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch backup schedule' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await validateSession(token)
    if (!member || (member.trusteeRole !== 'President' && member.trusteeRole !== 'PRESIDENT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { schedule } = body

    // Validate schedule
    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule configuration is required' },
        { status: 400 }
      )
    }

    // Validate schedule properties
    const { enabled, frequency, retentionDays, timeOfDay } = schedule
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid enabled value' },
        { status: 400 }
      )
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency value' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      return NextResponse.json(
        { error: 'Invalid retention days value' },
        { status: 400 }
      )
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(timeOfDay)) {
      return NextResponse.json(
        { error: 'Invalid time format' },
        { status: 400 }
      )
    }

    await backupServices.updateBackupSchedule(schedule)
    await AuditService.log({
      action: 'UPDATE',
      entityType: 'backup_schedule',
      entityId: 'schedule',
      memberId: member.id,
      changes: { schedule }
    })

    return NextResponse.json({ message: 'Backup schedule updated successfully' })
  } catch (error) {
    console.error('Error updating backup schedule:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update backup schedule' },
      { status: 500 }
    )
  }
} 