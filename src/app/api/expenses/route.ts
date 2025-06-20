import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortColumn = searchParams.get('sortColumn') || 'date';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * pageSize;

    // Build where clause for search
    const whereClause: Prisma.ExpenseWhereInput = searchTerm ? {
      OR: [
        { description: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
        { category: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
        { paidTo: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } }
      ]
    } : {};

    // Get expenses with pagination and sorting
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: {
        [sortColumn]: sortDirection
      },
      skip,
      take: pageSize,
      select: {
        id: true,
        description: true,
        amount: true,
        category: true,
        paidTo: true,
        paymentMethod: true,
        billNumber: true,
        date: true,
        notes: true
      }
    });

    // Get total count for pagination
    const total = await prisma.expense.count({
      where: whereClause
    });

    // Calculate total amount
    const totalAmount = await prisma.expense.aggregate({
      _sum: {
        amount: true
      },
      where: whereClause
    });

    return NextResponse.json({
      expenses,
      total,
      totalAmount: totalAmount._sum?.amount || 0
    });
  } catch (err: any) {
    console.error('Error fetching expenses:', err);
    return NextResponse.json(
      { error: 'Failed to load expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        paymentMethod: data.paymentMethod,
        paidTo: data.paidTo,
        billNumber: data.billNumber || null,
        notes: data.notes || null,
        date: new Date(),
        createdAt: new Date()
      }
    });

    return NextResponse.json(expense);
  } catch (err: any) {
    console.error('Error creating expense:', err);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.update({
      where: { id: data.id },
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        paymentMethod: data.paymentMethod,
        paidTo: data.paidTo,
        billNumber: data.billNumber || null,
        notes: data.notes || null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(expense);
  } catch (err: any) {
    console.error('Error updating expense:', err);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
} 