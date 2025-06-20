import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Workshop resource ID is required' },
        { status: 400 }
      );
    }

    // Check if workshop resource exists
    const resource = await prisma.workshopResource.findUnique({
      where: { id }
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Workshop resource not found' },
        { status: 404 }
      );
    }

    // Delete the workshop resource
    await prisma.workshopResource.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Workshop resource deleted successfully'
    });
  } catch (err: any) {
    console.error('Error deleting workshop resource:', err);
    return NextResponse.json(
      { 
        error: 'Failed to delete workshop resource',
        details: err.message
      },
      { status: 500 }
    );
  }
} 