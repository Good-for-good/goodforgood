import { NextResponse } from 'next/server';
import { getAuthToken, validateSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const member = await validateSession(token);
    if (!member) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Return member data without password
    const { password: _, ...memberData } = member;
    return NextResponse.json(memberData);
  } catch (err: any) {
    console.error('Auth check error:', err);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 