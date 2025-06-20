import { prisma } from '../db'
import { Prisma } from '@prisma/client'
import type { 
  Member, 
  Contribution, 
  Donation, 
  Expense, 
  Activity,
  WorkshopResource,
  Meeting,
  Link
} from '@prisma/client'

// Member Services
export const memberServices = {
  create: async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    return prisma.member.create({ 
      data: {
        ...data,
        permissions: data.permissions as Prisma.InputJsonValue
      }
    })
  },

  update: async (id: string, data: Partial<Member>) => {
    return prisma.member.update({
      where: { id },
      data: {
        ...data,
        permissions: data.permissions ? data.permissions as Prisma.InputJsonValue : undefined
      }
    })
  },

  delete: async (id: string) => {
    return prisma.member.delete({
      where: { id }
    })
  },

  getAll: async () => {
    return prisma.member.findMany({
      include: {
        contributions: true,
        activities: true,
        meetings: true,
        donations: true
      }
    })
  },

  getById: async (id: string) => {
    return prisma.member.findUnique({
      where: { id },
      include: {
        contributions: true,
        activities: true,
        meetings: true,
        donations: true
      }
    })
  }
}

// Activity Services
export const activityServices = {
  create: async (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    return prisma.activity.create({ data })
  },

  update: async (id: string, data: Partial<Activity>) => {
    return prisma.activity.update({
      where: { id },
      data
    })
  },

  delete: async (id: string) => {
    return prisma.activity.delete({
      where: { id }
    })
  },

  getAll: async () => {
    return prisma.activity.findMany({
      include: {
        participants: {
          include: {
            member: true
          }
        }
      }
    })
  },

  getById: async (id: string) => {
    return prisma.activity.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            member: true
          }
        }
      }
    })
  }
}

// Meeting Services
export const meetingServices = {
  create: async (data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'> & { decisions?: any[]; attachments?: any[] }) => {
    return prisma.meeting.create({ 
      data: {
        ...data,
        decisions: data.decisions ? {
          create: data.decisions
        } : undefined,
        attachments: data.attachments ? {
          create: data.attachments
        } : undefined
      }
    })
  },

  update: async (id: string, data: Partial<Meeting>) => {
    return prisma.meeting.update({
      where: { id },
      data
    })
  },

  delete: async (id: string) => {
    return prisma.meeting.delete({
      where: { id }
    })
  },

  getAll: async () => {
    return prisma.meeting.findMany({
      include: {
        decisions: true,
        attendees: {
          include: {
            member: true
          }
        },
        attachments: true
      }
    })
  }
}

// Expense Services
export const expenseServices = {
  create: async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    return prisma.expense.create({ data })
  },

  update: async (id: string, data: Partial<Expense>) => {
    return prisma.expense.update({
      where: { id },
      data
    })
  },

  delete: async (id: string) => {
    return prisma.expense.delete({
      where: { id }
    })
  },

  getAll: async () => {
    return prisma.expense.findMany()
  }
}

// Donation Services
export const donationServices = {
  create: async (data: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>) => {
    return prisma.donation.create({ data })
  },

  update: async (id: string, data: Partial<Donation>) => {
    return prisma.donation.update({
      where: { id },
      data
    })
  },

  delete: async (id: string) => {
    return prisma.donation.delete({
      where: { id }
    })
  },

  getAll: async () => {
    return prisma.donation.findMany({
      include: {
        member: true
      }
    })
  }
}

// Workshop Resource Services
export const workshopServices = {
  create: async (data: Omit<WorkshopResource, 'id' | 'createdAt' | 'updatedAt'>) => {
    return prisma.workshopResource.create({ 
      data: {
        ...data,
        expertise: data.expertise as Prisma.InputJsonValue
      }
    })
  },

  update: async (id: string, data: Partial<WorkshopResource>) => {
    return prisma.workshopResource.update({
      where: { id },
      data: {
        ...data,
        expertise: data.expertise ? data.expertise as Prisma.InputJsonValue : undefined
      }
    })
  },

  delete: async (id: string) => {
    return prisma.workshopResource.delete({
      where: { id }
    })
  },

  getAll: async () => {
    return prisma.workshopResource.findMany()
  }
}

// Link Services
export const linkServices = {
  create: async (data: Omit<Link, 'id' | 'createdAt' | 'updatedAt'>) => {
    return prisma.link.create({ data })
  },

  update: async (id: string, data: Partial<Link>) => {
    return prisma.link.update({
      where: { id },
      data
    })
  },

  delete: async (id: string) => {
    return prisma.link.delete({
      where: { id }
    })
  },

  getAll: async () => {
    return prisma.link.findMany()
  }
}

interface SystemConfigRow {
  value: Prisma.JsonValue
}

export const databaseService = {
  /**
   * Get a system configuration value by key
   */
  getSystemConfig: async <T>(key: string): Promise<T | null> => {
    try {
      const config = await prisma.$queryRaw<SystemConfigRow[]>`
        SELECT value FROM system_configs WHERE key = ${key}
      `
      return config?.[0]?.value as unknown as T || null
    } catch (error) {
      console.error('Error getting system config:', error)
      return null
    }
  },

  /**
   * Update or create a system configuration
   */
  upsertSystemConfig: async <T>(key: string, value: T): Promise<void> => {
    try {
      await prisma.$executeRaw`
        INSERT INTO system_configs (key, value, "createdAt", "updatedAt")
        VALUES (${key}, ${value as unknown as Prisma.JsonValue}, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = ${value as unknown as Prisma.JsonValue},
            "updatedAt" = NOW()
      `
    } catch (error) {
      console.error('Error upserting system config:', error)
      throw new Error('Failed to update system configuration')
    }
  }
} 