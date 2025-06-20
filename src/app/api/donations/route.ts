import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Helper function to validate donation data
function validateDonationData(data: any) {
  const errors = [];
  if (!data.donor) errors.push('Donor is required');
  if (!data.amount || isNaN(data.amount)) errors.push('Valid amount is required');
  if (!data.purpose) errors.push('Purpose is required');
  if (!data.type) errors.push('Type is required');
  return errors;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const sortColumn = url.searchParams.get('sortColumn') || 'date';
    const sortDirection = (url.searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';
    const memberId = url.searchParams.get('memberId');

    const skip = (page - 1) * pageSize;

    // Build where clause for search and memberId
    const whereClause: Prisma.DonationWhereInput = {
      ...(searchTerm ? {
        OR: [
          { donor: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
          { purpose: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
          { notes: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } }
        ]
      } : {}),
      ...(memberId ? { memberId } : {})
    };

    // If memberId is provided, return all donations without pagination
    const donations = await prisma.donation.findMany({
      where: whereClause,
      orderBy: {
        [sortColumn]: sortDirection
      },
      ...(memberId ? {} : { skip, take: pageSize }),
      include: {
        member: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Get total count for pagination (only if not fetching by memberId)
    const total = memberId ? donations.length : await prisma.donation.count({
      where: whereClause
    });

    // Calculate total amount
    const totalAmount = await prisma.donation.aggregate({
      _sum: {
        amount: true
      },
      where: whereClause
    });

    return NextResponse.json({
      donations,
      total,
      totalAmount: totalAmount._sum?.amount || 0
    });
  } catch (err: any) {
    console.error('Error fetching donations:', err);
    return NextResponse.json(
      { error: 'Failed to load donations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate input
    const errors = validateDonationData(data);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.create({
      data: {
        donor: data.donor,
        memberId: data.memberId,
        amount: data.amount,
        purpose: data.purpose,
        notes: data.notes || undefined,
        date: new Date(data.date || Date.now()),
        type: data.type
      }
    });
    return NextResponse.json(donation);
  } catch (err: any) {
    console.error('Error creating donation:', err);
    return NextResponse.json(
      { error: 'Failed to create donation', details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    // Validate input
    const errors = validateDonationData(data);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.update({
      where: { id: data.id },
      data: {
        donor: data.donor,
        amount: data.amount,
        purpose: data.purpose,
        notes: data.notes || undefined,
        type: data.type,
        date: data.date ? new Date(data.date) : undefined
      }
    });
    return NextResponse.json(donation);
  } catch (err: any) {
    console.error('Error updating donation:', err);
    return NextResponse.json(
      { error: 'Failed to update donation', details: err.message },
      { status: 500 }
    );
  }
} 