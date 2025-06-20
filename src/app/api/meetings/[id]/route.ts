import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const data = await request.json();
    const { id } = await context.params;
    
    // Validate required fields
    if (!data.title || !data.date) {
      return NextResponse.json(
        { error: 'Title and date are required' },
        { status: 400 }
      );
    }

    const timestamp = new Date();

    // Update the meeting with all its relations
    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title: data.title,
        date: new Date(data.date),
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        location: data.location || '',
        agenda: data.agenda || '',
        minutes: data.minutes || '',
        // Update decisions - delete existing and create new ones
        decisions: {
          deleteMany: {},
          create: data.decisions.map((decision: string) => ({
            decision
          }))
        },
        // Update attendees - delete existing and create new ones
        attendees: {
          deleteMany: {},
          create: data.attendees.map((attendee: any) => ({
            memberId: attendee.memberId,
            role: attendee.role,
            present: attendee.present
          }))
        },
        // Update attachments - delete existing and create new ones
        attachments: {
          deleteMany: {},
          create: data.attachments.map((attachment: any) => ({
            name: attachment.name,
            url: attachment.url,
            type: attachment.type
          }))
        },
        updatedAt: timestamp
      },
      include: {
        decisions: true,
        attendees: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                trusteeRole: true
              }
            }
          }
        },
        attachments: true
      }
    });

    return NextResponse.json(meeting);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }
    }
    console.error('Error updating meeting:', err);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
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

    // Delete the meeting and all related records
    await prisma.$transaction([
      // Delete all decisions
      prisma.meetingDecision.deleteMany({
        where: { meetingId: id }
      }),
      // Delete all attendees
      prisma.meetingAttendee.deleteMany({
        where: { meetingId: id }
      }),
      // Delete all attachments
      prisma.meetingAttachment.deleteMany({
        where: { meetingId: id }
      }),
      // Finally delete the meeting
      prisma.meeting.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }
    }
    console.error('Error deleting meeting:', err);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
} 