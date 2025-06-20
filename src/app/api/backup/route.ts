import { NextRequest, NextResponse } from 'next/server'
import { backupServices } from '@/lib/services/backup'
import { validateSession } from '@/lib/auth'
import { AuditService } from '@/lib/services/audit'
import { googleDriveService } from '@/lib/services/google-drive'

function isPresident(member: any): boolean {
  if (!member?.trusteeRole) return false;
  const role = member.trusteeRole.toUpperCase();
  return role === 'PRESIDENT';
}

// Helper function to check Google Drive configuration
async function checkGoogleDriveConfig() {
  const issues: string[] = [];
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    issues.push('GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured');
  }
  if (!process.env.GOOGLE_PRIVATE_KEY) {
    issues.push('GOOGLE_PRIVATE_KEY is not configured');
  }
  if (process.env.NEXT_PUBLIC_ENABLE_CLOUD_BACKUP !== 'true') {
    issues.push('Cloud backup is not enabled (NEXT_PUBLIC_ENABLE_CLOUD_BACKUP !== true)');
  }

  return issues;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await validateSession(token)
    if (!member || !isPresident(member)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const fileId = searchParams.get('file')
    const type = searchParams.get('type') as 'local' | 'cloud' || 'local'

    // If using cloud backup, verify configuration
    if (type === 'cloud') {
      const configIssues = await checkGoogleDriveConfig();
      if (configIssues.length > 0) {
        console.error('Google Drive configuration issues:', configIssues);
        return NextResponse.json({ 
          error: 'Google Drive configuration error', 
          details: configIssues 
        }, { status: 500 });
      }

      // Test Google Drive connection
      try {
        await googleDriveService.getOrCreateFolder('GoodForGood Backups');
      } catch (driveError) {
        console.error('Google Drive connection test failed:', driveError);
        return NextResponse.json({ 
          error: 'Failed to connect to Google Drive',
          details: driveError instanceof Error ? driveError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    switch (action) {
      case 'types':
        // Return available backup types based on environment
        const types: ('local' | 'cloud')[] = ['local']
        if (process.env.NEXT_PUBLIC_ENABLE_CLOUD_BACKUP === 'true') {
          types.push('cloud')
        }
        return NextResponse.json({ types })

      case 'create':
        const backupResult = await backupServices.createBackup(type)
        await AuditService.log({
          action: 'CREATE',
          entityType: 'backup',
          entityId: new Date().toISOString(),
          memberId: member.id,
          changes: { type, result: backupResult }
        })
        return NextResponse.json({ result: backupResult })

      case 'list':
        const backups = await backupServices.listBackups(type)
        return NextResponse.json({ backups })

      case 'info':
        if (!fileId) {
          return NextResponse.json({ error: 'Missing fileId parameter' }, { status: 400 })
        }
        const info = await backupServices.getBackupInfo(fileId, type)
        return NextResponse.json({ info })

      case 'schedule':
        const schedule = await backupServices.getBackupSchedule()
        return NextResponse.json({ schedule })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Detailed backup API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      error: 'Backup operation failed',
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await validateSession(token)
    if (!member || !isPresident(member)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, fileId, type = 'local' } = body

    if (action === 'restore' && fileId) {
      await backupServices.restoreFromBackup(fileId)
      await AuditService.log({
        action: 'UPDATE',
        entityType: 'backup',
        entityId: fileId,
        memberId: member.id,
        summary: `Restored database from ${type} backup`
      })
      return NextResponse.json({ message: 'Backup restored successfully' })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await validateSession(token)
    if (!member || !isPresident(member)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('file')
    const type = searchParams.get('type') as 'local' | 'cloud' || 'local'

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    await backupServices.deleteBackup(fileId, type)
    await AuditService.log({
      action: 'DELETE',
      entityType: 'backup',
      entityId: fileId,
      memberId: member.id,
      changes: { type }
    })
    return NextResponse.json({ message: 'Backup deleted successfully' })
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 