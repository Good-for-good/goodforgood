import { validateSession, getAuthToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Try to get token from request body first
    const body = await request.json();
    let token = body.token;

    // If no token in body, try to get from cookie
    if (!token) {
      token = await getAuthToken();
    }

    if (!token) {
      return NextResponse.json({ valid: false, message: 'No token provided' });
    }

    const member = await validateSession(token);
    
    if (!member) {
      console.log('Session validation failed for token');
      return NextResponse.json({ valid: false, message: 'Invalid session' });
    }

    return NextResponse.json({ 
      valid: true,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        trusteeRole: member.trusteeRole,
        accountStatus: member.accountStatus,
        permissions: member.permissions
      }
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ valid: false, message: 'Invalid session' });
  }
} 