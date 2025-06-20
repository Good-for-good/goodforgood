import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: Prisma.MeetingWhereInput = searchTerm ? {
      OR: [
        { title: { contains: searchTerm } },
        { location: { contains: searchTerm } },
        { agenda: { contains: searchTerm } }
      ]
    } : {};

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
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
          decisions: true,
          attachments: true
        }
      }),
      prisma.meeting.count({ where })
    ]);

    return NextResponse.json({
      meetings,
      total,
      hasMore: skip + meetings.length < total
    });
  } catch (err: any) {
    console.error('Error fetching meetings:', err);
    return NextResponse.json(
      { error: 'Failed to load meetings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.date) {
      return NextResponse.json(
        { error: 'Title and date are required' },
        { status: 400 }
      );
    }

    const timestamp = new Date();
    
    // Create the meeting with all its relations
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        location: data.location || '',
        agenda: data.agenda || '',
        minutes: data.minutes || '',
        // Create decisions
        decisions: {
          create: data.decisions.map((decision: string) => ({
            decision
          }))
        },
        // Create attendees
        attendees: {
          create: data.attendees.map((attendee: any) => ({
            memberId: attendee.memberId,
            role: attendee.role,
            present: attendee.present
          }))
        },
        // Create attachments
        attachments: {
          create: data.attachments.map((attachment: any) => ({
            name: attachment.name,
            url: attachment.url,
            type: attachment.type
          }))
        },
        createdAt: timestamp,
        updatedAt: timestamp
      },
      // Include all relations in the response
      include: {
        decisions: true,
        attendees: {
          include: {
            member: true
          }
        },
        attachments: true
      }
    });

    return NextResponse.json(meeting);
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.title || !data.date) {
      return NextResponse.json(
        { error: 'ID, title, and date are required' },
        { status: 400 }
      );
    }

    const timestamp = new Date();

    // Update the meeting with all its relations
    const meeting = await prisma.meeting.update({
      where: { id: data.id },
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
      // Include all relations in the response
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    await prisma.meeting.delete({
      where: { id }
    });

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