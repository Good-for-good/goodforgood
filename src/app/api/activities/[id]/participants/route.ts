import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
  };

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { memberIds } = await request.json();
    const { id } = await context.params;

    // Delete existing participants
    await prisma.activityParticipant.deleteMany({
      where: { activityId: id }
    });

    // Add new participants
    await prisma.activityParticipant.createMany({
      data: memberIds.map((memberId: string) => ({
        activityId: id,
        memberId
      }))
    });

    // Update activity participant count
    await prisma.activity.update({
      where: { id },
      data: {
        currentParticipants: memberIds.length,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating participants:', err);
    return NextResponse.json(
      { error: 'Failed to update participants' },
      { status: 500 }
    );
  }
} 