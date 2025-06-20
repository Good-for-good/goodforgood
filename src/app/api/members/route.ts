import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { accountStatus: status } : {};

    const members = await prisma.member.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    console.error('Error fetching members:', err);
    return NextResponse.json(
      { error: 'Failed to load members', details: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required fields' },
        { status: 400 }
      );
    }

    // Check if email is already taken
    const existingMember = await prisma.member.findUnique({
      where: { email: data.email },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Generate a default password (you may want to implement a proper password reset flow)
    const defaultPassword = 'Welcome123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const member = await prisma.member.create({
      data: {
        ...data,
        password: hashedPassword,
        joinDate: new Date(data.joinDate),
        roleStartDate: data.roleStartDate ? new Date(data.roleStartDate) : null,
        roleEndDate: data.roleEndDate ? new Date(data.roleEndDate) : null,
        photo: data.photo || null,
        trusteeRole: data.trusteeRole || null,
      }
    });

    // Remove password from response
    const { password, ...memberWithoutPassword } = member;
    return NextResponse.json(memberWithoutPassword);
  } catch (err: any) {
    console.error('Error creating member:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create member' },
      { status: 500 }
    );
  }
} 