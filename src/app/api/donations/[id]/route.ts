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
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Check if donation exists
    const existingDonation = await prisma.donation.findUnique({
      where: { id }
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Update the donation
    const donation = await prisma.donation.update({
      where: { id },
      data: {
        donor: data.donor,
        amount: data.amount,
        purpose: data.purpose,
        notes: data.notes || null,
        date: new Date(data.date),
        type: data.type || 'general',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Donation updated successfully',
      donation
    });
  } catch (err: any) {
    console.error('Error updating donation:', err);
    return NextResponse.json(
      { 
        error: 'Failed to update donation',
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
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    // Check if donation exists
    const donation = await prisma.donation.findUnique({
      where: { id }
    });

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Delete the donation
    await prisma.donation.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (err: any) {
    console.error('Error deleting donation:', err);
    return NextResponse.json(
      { 
        error: 'Failed to delete donation',
        details: err.message
      },
      { status: 500 }
    );
  }
} 