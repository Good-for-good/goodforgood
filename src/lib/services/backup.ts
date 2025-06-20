import * as cron from 'node-cron'
import { prisma } from '../db'
import { databaseService } from './database'
import { PrismaClient, Prisma } from '@prisma/client'
import { googleDriveService } from './google-drive'
import * as fs from 'fs'
import * as path from 'path'

// Type for backup schedule configuration
interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  timeOfDay: string; // HH:mm format
  lastBackup?: Date;
}

// Type for backup data
interface BackupData {
  members: any[]
  contributions: any[]
  donations: any[]
  expenses: any[]
  activities: any[]
  activityParticipants: any[]
  workshopResources: any[]
  meetings: any[]
  meetingAttendees: any[]
  meetingDecisions: any[]
  meetingAttachments: any[]
  links: any[]
  sessions: any[]
  auditLogs: any[]
  timestamp: string
  version: string
}

export const backupServices = {
  /**
   * Create a backup of all database data
   */
  createBackup: async (type: 'local' | 'cloud' = 'local'): Promise<string> => {
    try {
      console.log('Fetching data for backup...')
      
      // Fetch all data from all tables
      const [
        members,
        contributions,
        donations,
        expenses,
        activities,
        activityParticipants,
        workshopResources,
        meetings,
        meetingAttendees,
        meetingDecisions,
        meetingAttachments,
        links,
        sessions,
        auditLogs
      ] = await Promise.all([
        prisma.member.findMany(),
        prisma.contribution.findMany(),
        prisma.donation.findMany(),
        prisma.expense.findMany(),
        prisma.activity.findMany(),
        prisma.activityParticipant.findMany(),
        prisma.workshopResource.findMany(),
        prisma.meeting.findMany(),
        prisma.meetingAttendee.findMany(),
        prisma.meetingDecision.findMany(),
        prisma.meetingAttachment.findMany(),
        prisma.link.findMany(),
        prisma.session.findMany(),
        prisma.auditLog.findMany()
      ])

      // Create backup object
      const backup: BackupData = {
        members,
        contributions,
        donations,
        expenses,
        activities,
        activityParticipants,
        workshopResources,
        meetings,
        meetingAttendees,
        meetingDecisions,
        meetingAttachments,
        links,
        sessions,
        auditLogs,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }

      // Validate backup object
      if (!backup.members || !Array.isArray(backup.members)) {
        throw new Error('Invalid backup data: members array is missing or invalid')
      }

      // Generate backup filename with timestamp
      const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`

      if (type === 'cloud') {
        // Upload to Google Drive
        console.log('Uploading backup to Google Drive...')
        const backupJson = JSON.stringify(backup, null, 2)
        const webViewLink = await googleDriveService.uploadFile(filename, backupJson)
        console.log('Backup created successfully in Google Drive')
        return webViewLink
      } else {
        // Save locally
        console.log('Saving backup locally...')
        const backupDir = path.join(process.cwd(), 'backups')
        
        // Create backups directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true })
        }

        const backupPath = path.join(backupDir, filename)
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
        console.log('Backup created successfully locally')
        return filename
      }
    } catch (error) {
      console.error('Detailed backup error:', error)
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * List all available backups
   */
  listBackups: async (type: 'local' | 'cloud' = 'local') => {
    try {
      if (type === 'cloud') {
        return await googleDriveService.listBackups()
      } else {
        const backupDir = path.join(process.cwd(), 'backups')
        if (!fs.existsSync(backupDir)) {
          return []
        }
        return fs.readdirSync(backupDir)
          .filter(file => file.endsWith('.json'))
          .map(file => ({
            name: file,
            id: file,
            webViewLink: file
          }))
      }
    } catch (error) {
      console.error('Error listing backups:', error)
      throw new Error('Failed to list backups')
    }
  },

  /**
   * Delete a backup file
   */
  deleteBackup: async (fileId: string, type: 'local' | 'cloud' = 'local') => {
    try {
      if (type === 'cloud') {
        await googleDriveService.deleteFile(fileId)
      } else {
        const backupPath = path.join(process.cwd(), 'backups', fileId)
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath)
        }
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      throw new Error('Failed to delete backup')
    }
  },

  /**
   * Restore data from a backup file
   */
  restoreFromBackup: async (fileId: string): Promise<void> => {
    try {
      // Download backup from Google Drive
      const backupContent = await googleDriveService.downloadFile(fileId)
      const backup: BackupData = JSON.parse(backupContent)

      // Start a transaction with extended timeout
      await prisma.$transaction(async (tx) => {
        // Clear existing data (in reverse order of dependencies)
        console.log('Clearing existing data...')
        
        // First, clear tables with foreign key constraints
        console.log('Clearing audit logs...')
        await tx.auditLog.deleteMany({})
        
        console.log('Clearing sessions...')
        await tx.session.deleteMany({})
        
        console.log('Clearing meeting related data...')
        await tx.meetingAttachment.deleteMany({})
        await tx.meetingDecision.deleteMany({})
        await tx.meetingAttendee.deleteMany({})
        await tx.meeting.deleteMany({})
        
        console.log('Clearing activity related data...')
        await tx.activityParticipant.deleteMany({})
        await tx.activity.deleteMany({})
        
        console.log('Clearing other data...')
        await tx.workshopResource.deleteMany({})
        await tx.link.deleteMany({})
        await tx.donation.deleteMany({})
        await tx.expense.deleteMany({})
        await tx.contribution.deleteMany({})
        
        // Finally, clear members after all dependent tables
        console.log('Clearing members...')
        await tx.member.deleteMany({})

        // Restore data in order of dependencies
        console.log('Restoring data...')
        
        // First restore members as they are referenced by other tables
        if (backup.members?.length) {
          console.log(`Restoring ${backup.members.length} members...`)
          await tx.member.createMany({ data: backup.members })
        }
        
        // Then restore independent tables
        if (backup.contributions?.length) {
          console.log(`Restoring ${backup.contributions.length} contributions...`)
          await tx.contribution.createMany({ data: backup.contributions })
        }
        if (backup.donations?.length) {
          console.log(`Restoring ${backup.donations.length} donations...`)
          await tx.donation.createMany({ data: backup.donations })
        }
        if (backup.expenses?.length) {
          console.log(`Restoring ${backup.expenses.length} expenses...`)
          await tx.expense.createMany({ data: backup.expenses })
        }
        if (backup.activities?.length) {
          console.log(`Restoring ${backup.activities.length} activities...`)
          await tx.activity.createMany({ data: backup.activities })
        }
        if (backup.workshopResources?.length) {
          console.log(`Restoring ${backup.workshopResources.length} workshop resources...`)
          await tx.workshopResource.createMany({ data: backup.workshopResources })
        }
        if (backup.meetings?.length) {
          console.log(`Restoring ${backup.meetings.length} meetings...`)
          await tx.meeting.createMany({ data: backup.meetings })
        }
        if (backup.links?.length) {
          console.log(`Restoring ${backup.links.length} links...`)
          await tx.link.createMany({ data: backup.links })
        }
        
        // Finally restore relationship tables
        if (backup.activityParticipants?.length) {
          console.log(`Restoring ${backup.activityParticipants.length} activity participants...`)
          await tx.activityParticipant.createMany({ data: backup.activityParticipants })
        }
        if (backup.meetingAttendees?.length) {
          console.log(`Restoring ${backup.meetingAttendees.length} meeting attendees...`)
          await tx.meetingAttendee.createMany({ data: backup.meetingAttendees })
        }
        if (backup.meetingDecisions?.length) {
          console.log(`Restoring ${backup.meetingDecisions.length} meeting decisions...`)
          await tx.meetingDecision.createMany({ data: backup.meetingDecisions })
        }
        if (backup.meetingAttachments?.length) {
          console.log(`Restoring ${backup.meetingAttachments.length} meeting attachments...`)
          await tx.meetingAttachment.createMany({ data: backup.meetingAttachments })
        }
        if (backup.sessions?.length) {
          console.log(`Restoring ${backup.sessions.length} sessions...`)
          await tx.session.createMany({ data: backup.sessions })
        }

        // Finally restore audit logs
        if (backup.auditLogs?.length) {
          console.log(`Restoring ${backup.auditLogs.length} audit logs...`)
          await tx.auditLog.createMany({ data: backup.auditLogs })
        }
      }, {
        maxWait: 60000, // 60 seconds
        timeout: 60000
      })
      
      console.log('Restore completed successfully')
    } catch (error) {
      console.error('Detailed restore error:', error)
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Get backup schedule configuration
   */
  getBackupSchedule: async (): Promise<BackupScheduleConfig> => {
    // Implementation remains the same
      return {
      enabled: false,
      frequency: 'daily',
      retentionDays: 30,
      timeOfDay: '00:00'
    }
  },

  /**
   * Update backup schedule configuration
   */
  updateBackupSchedule: async (config: BackupScheduleConfig): Promise<void> => {
    // Implementation remains the same
  }
} 