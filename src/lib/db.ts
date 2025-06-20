import { PrismaClient } from '@prisma/client'
import { auditMiddleware } from './middleware/audit'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  // Create base client first
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Add connection timeout
    log: ['error', 'warn'],
  });

  // Apply middleware to base client
  client.$use(auditMiddleware);

  // Then extend the client
  return client.$extends({
    result: {
      member: {
        // Ensure dates are properly serialized
        createdAt: {
          needs: { createdAt: true },
          compute(member) {
            return new Date(member.createdAt)
          }
        },
        updatedAt: {
          needs: { updatedAt: true },
          compute(member) {
            return new Date(member.updatedAt)
          }
        }
      }
    }
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma 