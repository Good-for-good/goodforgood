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
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    const link = await prisma.link.update({
      where: { id },
      data: {
        title: data.title,
        url: data.url,
        category: data.category,
        description: data.description,
        icon: data.icon,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(link);
  } catch (err: any) {
    console.error('Error updating link:', err);
    return NextResponse.json(
      { error: 'Failed to update link' },
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
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    await prisma.link.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting link:', err);
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
  }
} 