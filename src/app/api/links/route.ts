import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    const category = searchParams.get('category');

    const where: Prisma.LinkWhereInput = {
      ...(searchTerm ? {
        OR: [
          { title: { contains: searchTerm } },
          { url: { contains: searchTerm } },
          { description: { contains: searchTerm } }
        ]
      } : {}),
      ...(category && category !== 'all' ? { category } : {})
    };

    const links = await prisma.link.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json({ links });
  } catch (err: any) {
    console.error('Error fetching links:', err);
    return NextResponse.json(
      { error: 'Failed to load links' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const link = await prisma.link.create({
      data: {
        title: data.title,
        url: data.url,
        category: data.category,
        description: data.description,
        icon: data.icon,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(link);
  } catch (err: any) {
    console.error('Error creating link:', err);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
} 