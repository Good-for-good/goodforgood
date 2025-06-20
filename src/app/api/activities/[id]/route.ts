import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Validate input
    const errors = validateActivityData(data);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Check if activity exists
    const existingActivity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Update the activity
    const timestamp = new Date();
    const activity = await prisma.activity.update({
      where: { id },
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

    return NextResponse.json({
      success: true,
      message: 'Activity updated successfully',
      activity
    });
  } catch (err: any) {
    console.error('Error updating activity:', err);
    return NextResponse.json(
      { 
        error: 'Failed to update activity',
        details: err.message
      },
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
    
    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Delete the activity
    await prisma.activity.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (err: any) {
    console.error('Error deleting activity:', err);
    return NextResponse.json(
      { 
        error: 'Failed to delete activity',
        details: err.message
      },
      { status: 500 }
    );
  }
} 