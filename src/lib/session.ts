import { cookies } from 'next/headers';
import { prisma } from './db';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            permissions: true,
          },
        },
      },
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    return {
      id: session.id,
      memberId: session.memberId,
      member: session.member,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
} 
 
 