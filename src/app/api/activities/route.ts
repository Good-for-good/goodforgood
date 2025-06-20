import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Helper function to validate activity data
function validateActivityData(data: any) {
  const errors = [];
  
  // Required fields
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.description?.trim()) errors.push('Description is required');
  if (!data.date) errors.push('Date is required');
  if (!data.startTime) errors.push('Start time is required');
  if (!data.endTime) errors.push('End time is required');
  if (!data.location?.trim()) errors.push('Location is required');
  if (!data.organizer?.trim()) errors.push('Organizer is required');
  if (!data.category) errors.push('Category is required');
  if (!data.status) errors.push('Status is required');

  // Validate numeric fields
  if (data.maxParticipants !== null && data.maxParticipants !== undefined) {
    if (isNaN(data.maxParticipants) || data.maxParticipants < 1) {
      errors.push('Maximum participants must be a positive number');
    }
  }
  if (data.budget !== null && data.budget !== undefined) {
    if (isNaN(data.budget) || data.budget < 0) {
      errors.push('Budget cannot be negative');
    }
  }
  if (data.actualAmount !== null && data.actualAmount !== undefined) {
    if (isNaN(data.actualAmount) || data.actualAmount < 0) {
      errors.push('Actual amount cannot be negative');
    }
  }

  // Validate date
  try {
    new Date(data.date);
  } catch {
    errors.push('Invalid date format');
  }

  return errors;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');
    const status = searchParams.get('status');

    // Build where clause
    const where: Prisma.ActivityWhereInput = {
      ...(searchTerm ? {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
          { location: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
          { organizer: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } }
        ]
      } : {}),
      ...(status ? { status } : {})
    };

    // Get activities with pagination
    const activities = await prisma.activity.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' }
      ],
      skip,
      take,
      include: {
        participants: {
          include: {
            member: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.activity.count({ where });

    return NextResponse.json({
      activities,
      total: totalCount,
      hasMore: skip + take < totalCount
    });
  } catch (err: any) {
    console.error('Error fetching activities:', err);
    return NextResponse.json(
      { error: 'Failed to load activities', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate input
    const errors = validateActivityData(data);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const timestamp = new Date();
    const activity = await prisma.activity.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location.trim(),
        category: data.category,
        status: data.status,
        organizer: data.organizer.trim(),
        maxParticipants: data.maxParticipants || null,
        currentParticipants: 0,
        budget: data.budget || null,
        notes: data.notes?.trim() || null,
        actualAmount: data.actualAmount || null,
        contributionDate: data.status === 'completed' ? timestamp : null,
        contributionNotes: data.contributionNotes?.trim() || null,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      include: {
        participants: {
          include: {
            member: true
          }
        }
      }
    });

    return NextResponse.json(activity);
  } catch (err: any) {
    console.error('Error creating activity:', err);
    return NextResponse.json(
      { error: 'Failed to create activity', details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Validate input
    const errors = validateActivityData(data);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const timestamp = new Date();
    const activity = await prisma.activity.update({
      where: { id: data.id },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location.trim(),
        category: data.category,
        status: data.status,
        organizer: data.organizer.trim(),
        maxParticipants: data.maxParticipants || null,
        budget: data.budget || null,
        notes: data.notes?.trim() || null,
        actualAmount: data.actualAmount || null,
        contributionDate: data.status === 'completed' ? timestamp : null,
        contributionNotes: data.contributionNotes?.trim() || null,
        updatedAt: timestamp
      },
      include: {
        participants: {
          include: {
            member: true
          }
        }
      }
    });

    return NextResponse.json(activity);
  } catch (err: any) {
    console.error('Error updating activity:', err);
    return NextResponse.json(
      { error: 'Failed to update activity', details: err.message },
      { status: 500 }
    );
  }
} 