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
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Update the expense
    const expense = await prisma.expense.update({
      where: { id },
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

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully',
      expense
    });
  } catch (err: any) {
    console.error('Error updating expense:', err);
    return NextResponse.json(
      { 
        error: 'Failed to update expense',
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
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (err: any) {
    console.error('Error deleting expense:', err);
    return NextResponse.json(
      { 
        error: 'Failed to delete expense',
        details: err.message
      },
      { status: 500 }
    );
  }
} 