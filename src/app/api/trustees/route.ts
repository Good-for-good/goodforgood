import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';

export async function GET() {
  try {
    // Get auth token directly from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      console.log('No auth token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the session
    const member = await validateSession(token);
    if (!member) {
      console.log('Invalid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trustees = await prisma.member.findMany({
      where: {
        trusteeRole: {
          not: null
        }
      },
      orderBy: [
        { trusteeRole: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(trustees);
  } catch (err: any) {
    console.error('Error fetching trustees:', err);
    return NextResponse.json(
      { error: 'Failed to load trustees', details: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
} 