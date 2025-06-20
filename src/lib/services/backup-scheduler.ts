import * as cron from 'node-cron'
import { backupServices } from './backup'
import { prisma } from '../db'
import { databaseService } from './database'
import { googleDriveService } from './google-drive'
import { AuditService } from './audit'
import path from 'path'
import fs from 'fs'

interface BackupConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  timeOfDay: string
  retentionDays: number
  type?: 'local' | 'cloud'
}

class BackupScheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map()

  /**
   * Initialize the backup scheduler
   */
  async initialize() {
    // Only run in production and on the server
    if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    try {
      console.log('Initializing backup scheduler...')
      const config = await backupServices.getBackupSchedule()
      
      if (config?.enabled) {
        await this.scheduleBackup(config)
      }
    } catch (error) {
      console.error('Failed to initialize backup scheduler:', error)
    }
  }

  /**
   * Schedule a backup based on configuration
   */
  private async scheduleBackup(config: BackupConfig) {
    // Stop existing cron job if any
    this.stopCronJob('backup')

    // Parse time
    const [hours, minutes] = config.timeOfDay.split(':').map(Number)

    // Create cron expression based on frequency
    let cronExpression: string
    switch (config.frequency) {
      case 'daily':
        cronExpression = `${minutes} ${hours} * * *`
        break
      case 'weekly':
        cronExpression = `${minutes} ${hours} * * 0` // Run on Sundays
        break
      case 'monthly':
        cronExpression = `${minutes} ${hours} 1 * *` // Run on 1st of each month
        break
      default:
        throw new Error('Invalid backup frequency')
    }

    // Determine backup type based on environment
    const backupType = process.env.NEXT_PUBLIC_ENABLE_CLOUD_BACKUP === 'true' ? 'cloud' : 'local'

    // Create and schedule the cron job
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log('Starting scheduled backup...')
        
        // Create backup
        const backupResult = await backupServices.createBackup(backupType)
        console.log('Scheduled backup created:', backupResult)
        
        // Clean up old backups
        const backups = await backupServices.listBackups(backupType)
        if (backups.length > config.retentionDays) {
          // Sort by name (which includes timestamp) in ascending order
          // and delete the oldest ones
          const backupsToDelete = backups
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, backups.length - config.retentionDays)

          for (const backup of backupsToDelete) {
            await backupServices.deleteBackup(backup.id, backupType)
            console.log('Deleted old backup:', backup.name)
          }
        }
        console.log('Old backups cleaned up')

        // Verify the new backup
        try {
          let backupContent: string
          if (backupType === 'cloud') {
            backupContent = await googleDriveService.downloadFile(backupResult)
          } else {
            const backupPath = path.join(process.cwd(), 'backups', backupResult)
            backupContent = fs.readFileSync(backupPath, 'utf8')
          }

          const backup = JSON.parse(backupContent)
          const issues: string[] = []
          
          // Check backup structure
          if (!backup.timestamp) issues.push('Missing timestamp')
          if (!backup.version) issues.push('Missing version')
          
          // Check required arrays
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

          if (issues.length > 0) {
            console.error('Backup verification failed:', issues)
            // TODO: Send notification to administrators
          }

          // Log verification result
          await AuditService.log({
            action: 'UPDATE',
            entityType: 'backup',
            entityId: backupResult,
            memberId: 'system',
            summary: `Verified scheduled ${backupType} backup${issues.length > 0 ? ' with issues' : ' successfully'}`,
            changes: { issues }
          })
        } catch (error) {
          console.error('Error verifying backup:', error)
          // TODO: Send notification to administrators
        }

        // Update last backup timestamp
        await databaseService.upsertSystemConfig('backupSchedule', {
          ...config,
          lastBackup: new Date().toISOString()
        })

        console.log('Scheduled backup completed successfully')
      } catch (error) {
        console.error('Scheduled backup failed:', error)
        // TODO: Send notification to administrators
      }
    })

    // Store the job
    this.cronJobs.set('backup', job)
    console.log(`${backupType} backup scheduled: ${cronExpression}`)
  }

  /**
   * Stop a specific cron job
   */
  private stopCronJob(jobName: string) {
    const job = this.cronJobs.get(jobName)
    if (job) {
      job.stop()
      this.cronJobs.delete(jobName)
      console.log(`Stopped cron job: ${jobName}`)
    }
  }

  /**
   * Update backup schedule
   */
  async updateSchedule(config: BackupConfig) {
    if (config.enabled) {
      await this.scheduleBackup(config)
    } else {
      this.stopCronJob('backup')
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    for (const [jobName, job] of this.cronJobs) {
      job.stop()
      this.cronJobs.delete(jobName)
      console.log(`Stopped cron job: ${jobName}`)
    }
  }
}

// Create singleton instance
export const backupScheduler = new BackupScheduler()

// Initialize on import
backupScheduler.initialize().catch(error => {
  console.error('Failed to initialize backup scheduler:', error)
}) 