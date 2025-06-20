import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
  };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (err: any) {
    console.error('Error fetching member:', err);
    return NextResponse.json(
      { error: 'Failed to load member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    console.log('Received data:', data);
    console.log('Member ID:', id);

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id }
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle role update
    if ('trusteeRole' in data) {
      updateData.trusteeRole = data.trusteeRole;
      
      // Update role dates
      if (data.trusteeRole) {
        updateData.roleStartDate = data.roleStartDate ? new Date(data.roleStartDate) : new Date();
        updateData.roleEndDate = data.roleEndDate ? new Date(data.roleEndDate) : null;
        // Set account status to active when assigning a role
        updateData.accountStatus = 'active';
      } else {
        // If removing role, clear role dates
        updateData.roleStartDate = null;
        updateData.roleEndDate = null;
      }
    }

    // Handle account status update
    if ('accountStatus' in data) {
      updateData.accountStatus = data.accountStatus;
    }

    // Handle full member update
    if (data.name || data.email || data.phone || data.joinDate) {
      // Validate required fields for full update
      if (!data.name || !data.email || !data.phone || !data.joinDate) {
        return NextResponse.json(
          { error: 'Name, email, phone, and join date are required for full update' },
          { status: 400 }
        );
      }

      // Add member fields to update data
      updateData.name = data.name;
      updateData.email = data.email;
      updateData.phone = data.phone;
      updateData.photo = data.photo || null;
      
      try {
        const joinDate = new Date(data.joinDate);
        if (isNaN(joinDate.getTime())) {
          throw new Error('Invalid join date');
        }
        updateData.joinDate = joinDate;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid join date format' },
          { status: 400 }
        );
      }
    }

    console.log('Update data:', updateData);

    const member = await prisma.member.update({
      where: { id },
      data: updateData
    });

    console.log('Updated member:', member);
    return NextResponse.json(member);
  } catch (err: any) {
    console.error('Detailed error:', {
      name: err.name,
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack
    });
    
    // Handle specific Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'A member with this email already exists' },
          { status: 400 }
        );
      }
      if (err.code === 'P2025') {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }
    }

    // Handle validation errors
    if (err instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: 'Invalid data provided. Please check all fields.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update member: ' + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    // First check if member has any active roles or responsibilities
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        activities: {
          where: {
            activity: {
              status: {
                in: ['upcoming', 'ongoing']
              }
            }
          },
          include: {
            activity: true
          }
        },
        meetings: {
          where: {
            meeting: {
              date: {
                gte: new Date()
              }
            }
          },
          include: {
            meeting: true
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check for upcoming activities or meetings where this member is involved
    if (member.activities.length > 0 || member.meetings.length > 0) {
      const conflicts = {
        activities: member.activities.map(a => ({
          id: a.activity.id,
          title: a.activity.title,
          date: a.activity.date
        })),
        meetings: member.meetings.map(m => ({
          id: m.meeting.id,
          title: m.meeting.title,
          date: m.meeting.date
        }))
      };

      return NextResponse.json({
        error: 'Cannot delete member with active responsibilities',
        conflicts
      }, { status: 409 });
    }

    // If no conflicts, proceed with deletion
    await prisma.$transaction([
      // Delete all activity participations
      prisma.activityParticipant.deleteMany({
        where: { memberId: id }
      }),
      // Delete all meeting attendances
      prisma.meetingAttendee.deleteMany({
        where: { memberId: id }
      }),
      // Delete all donations
      prisma.donation.deleteMany({
        where: { memberId: id }
      }),
      // Finally delete the member
      prisma.member.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting member:', err);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
} 