import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortColumn = searchParams.get('sortColumn') || 'name';
    const sortDirection = (searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc';

    const skip = (page - 1) * pageSize;

    // Build where clause for search
    const whereClause: Prisma.DonationWhereInput = searchTerm ? {
      donor: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode
      }
    } : {};

    // Get all donations grouped by donor with aggregations
    const donorSummaries = await prisma.donation.groupBy({
      by: ['donor'],
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        donor: true
      },
      orderBy: sortColumn === 'totalAmount' ? {
        _sum: {
          amount: sortDirection
        }
      } : sortColumn === 'donationCount' ? {
        _count: {
          donor: sortDirection
        }
      } : {
        donor: sortDirection
      },
      skip,
      take: pageSize
    });

    // Get total count for pagination
    const totalDonors = await prisma.donation.groupBy({
      by: ['donor'],
      where: whereClause,
      _count: {
        donor: true
      }
    });

    // Get total amount
    const totalAmount = await prisma.donation.aggregate({
      _sum: {
        amount: true
      },
      where: whereClause
    });

    // Get last donation dates
    const lastDonations = await Promise.all(
      donorSummaries.map(async (summary) => {
        const lastDonation = await prisma.donation.findFirst({
          where: {
            donor: summary.donor
          },
          orderBy: {
            date: 'desc'
          },
          select: {
            date: true
          }
        });
        return {
          donor: summary.donor,
          lastDonation: lastDonation?.date
        };
      })
    );

    // Combine the data
    const donors = donorSummaries.map((summary) => ({
      name: summary.donor,
      totalAmount: summary._sum?.amount || 0,
      donationCount: summary._count?.donor || 0,
      lastDonation: lastDonations.find(d => d.donor === summary.donor)?.lastDonation || null
    }));

    return NextResponse.json({
      donors,
      total: totalDonors.length,
      totalAmount: totalAmount._sum?.amount || 0
    });
  } catch (err: any) {
    console.error('Error fetching donors:', err);
    return NextResponse.json(
      { error: 'Failed to load donors' },
      { status: 500 }
    );
  }
} 