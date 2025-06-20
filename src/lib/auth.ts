import { prisma } from './db';
import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const COOKIE_NAME = 'auth_token';
const SESSION_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Clean up expired sessions
export async function cleanupExpiredSessions() {
  try {
    // Only clean up sessions that are more than 1 day old
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

export async function createSession(memberId: string) {
  try {
    // Generate a random token
    const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY);

    // Use a transaction to ensure atomicity and reduce round trips
    await prisma.$transaction([
      // Remove existing sessions for this member
      prisma.session.deleteMany({
        where: { 
          OR: [
            { memberId },
            // Also clean up expired sessions but only if they're older than 1 day
            { 
              expiresAt: {
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          ]
        }
      }),
      // Create new session
      prisma.session.create({
    data: {
      memberId,
      token,
      expiresAt
    }
      })
    ]);

  return token;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

export async function validateSession(token: string) {
  try {
    // Check the session in database
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        member: true
      }
    });

    if (!session || !session.member) {
      console.log('Session not found or invalid:', { token });
      await removeSession(token);
      await removeAuthCookie();
      return null;
    }

    // Extend session if it's about to expire (less than 30 minutes left)
    const thirtyMinutes = 30 * 60 * 1000;
    if (session.expiresAt.getTime() - Date.now() < thirtyMinutes) {
      const newExpiresAt = new Date(Date.now() + SESSION_EXPIRY);
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiresAt }
      });
    }

    return session.member;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function removeSession(token: string) {
  try {
  await prisma.session.deleteMany({
    where: { token }
  });
  } catch (error) {
    console.error('Error removing session:', error);
    throw new Error('Failed to remove session');
  }
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) {
    console.log('No auth token found in cookies');
    return undefined;
  }
  return cookie.value;
}

export async function setAuthCookie(token: string) {
  try {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';

    cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
      secure: isProd,
    sameSite: 'lax',
      expires: new Date(Date.now() + SESSION_EXPIRY),
      path: '/',
      // Let the browser handle the domain automatically
      domain: undefined
  });
  } catch (error) {
    console.error('Error setting auth cookie:', error);
    throw new Error('Failed to set auth cookie');
  }
}

export async function removeAuthCookie() {
  try {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';

    // First delete the cookie
    cookieStore.delete(COOKIE_NAME);
    
    // Then set an expired cookie with the same settings
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      domain: undefined, // Don't set domain - let the browser handle it
      expires: new Date(0)
    });
  } catch (error) {
    console.error('Error removing auth cookie:', error);
    throw new Error('Failed to remove auth cookie');
  }
} 