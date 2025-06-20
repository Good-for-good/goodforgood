import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Donation, Expense, Activity } from '@prisma/client';

export async function GET() {
  try {
    // Fetch members count
    const totalMembers = await prisma.member.count();

    // Fetch donations
    const donations = await prisma.donation.findMany();
    const totalDonations = donations.reduce((sum: number, donation: Donation) => sum + (donation.amount || 0), 0);

    // Fetch recent donations
    const recentDonations = await prisma.donation.findMany({
      orderBy: { date: 'desc' },
      take: 5
    });

    // Fetch expenses
    const expenses = await prisma.expense.findMany();
    const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + (expense.amount || 0), 0);

    // Fetch recent expenses
    const recentExpenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 5
    });

    // Fetch activities
    const [upcomingActivities, ongoingActivities, completedActivities, recentActivities] = 
      await Promise.all([
        prisma.activity.count({ where: { status: 'upcoming' } }),
        prisma.activity.count({ where: { status: 'ongoing' } }),
        prisma.activity.count({ where: { status: 'completed' } }),
        prisma.activity.findMany({
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            actualAmount: true
          }
        })
      ]);

    // Calculate total contributions from completed activities
    const completedActivitiesData = await prisma.activity.findMany({
      where: { status: 'completed' },
      select: {
        actualAmount: true
      }
    });
    
    const totalContributions = completedActivitiesData.reduce(
      (sum: number, activity: Pick<Activity, 'actualAmount'>) => sum + (activity.actualAmount || 0), 
      0
    );

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers: totalMembers,
        totalDonations,
        totalExpenses,
        totalContributions,
        upcomingActivities,
        ongoingActivities,
        completedActivities
      },
      recentActivities,
      recentDonations,
      recentExpenses
    });
  } catch (err: any) {
    console.error('Error fetching dashboard data:', err);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
} 