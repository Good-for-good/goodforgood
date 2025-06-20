import { NextResponse } from 'next/server';
import { getAuthToken, removeAuthCookie, removeSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    if (token) {
      // Run these operations in parallel since they're independent
      await Promise.all([
        removeSession(token),
        removeAuthCookie()
      ]);
    }
    return new Response('Logged out successfully', { status: 200 });
  } catch (error) {
    console.error('Error during logout:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
} 