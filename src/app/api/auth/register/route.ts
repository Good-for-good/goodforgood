import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    console.log('Registration request received');
    const { name, email, phone, password } = await request.json();
    console.log('Request data:', { name, email, phone, passwordLength: password?.length });

    // Validate required fields
    if (!name || !email || !phone || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingMember = await prisma.member.findUnique({
      where: { email }
    });

    if (existingMember) {
      console.log('Email already registered:', email);
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create new member with pending status
    const newMember = await prisma.member.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        joinDate: new Date(),
        accountStatus: 'pending',
        permissions: {},
        trusteeRole: null,
        roleStartDate: null,
        roleEndDate: null,
        photo: null
      }
    });
    console.log('New member created:', newMember.id);

    // Remove password from response
    const { password: _, ...memberData } = newMember;

    return NextResponse.json(memberData, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
} 