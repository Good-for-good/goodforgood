import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma, WorkshopResource } from '@prisma/client';

interface TransformedWorkshopResource {
  id: string;
  name: string;
  specialization: string;
  type: string;
  expertise: any;
  reference: {
    name: string;
    relationship: string;
    contactDetails: {
      email: string;
      phone: string;
    };
  };
  contactDetails: {
    email: string;
    phone: string;
    address: string;
  };
  availability: string;
  previousWorkshops: string;
  notes: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

function transformWorkshopResource(resource: WorkshopResource): TransformedWorkshopResource {
  return {
    id: resource.id,
    name: resource.name,
    specialization: resource.specialization,
    type: resource.type,
    expertise: resource.expertise,
    reference: {
      name: resource.referenceName,
      relationship: resource.relationship,
      contactDetails: {
        email: resource.referenceEmail,
        phone: resource.referencePhone
      }
    },
    contactDetails: {
      email: resource.contactEmail,
      phone: resource.contactPhone,
      address: resource.contactAddress
    },
    availability: resource.availability,
    previousWorkshops: resource.previousWorkshops,
    notes: resource.notes,
    status: resource.status,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build where clause
    const where: Prisma.WorkshopResourceWhereInput = {
      ...(type && type !== 'all' ? { type } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { specialization: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
        ]
      } : {})
    };

    const resources = await prisma.workshopResource.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    // Transform the resources using the helper function
    const transformedResources = resources.map(transformWorkshopResource);

    return NextResponse.json({ resources: transformedResources });
  } catch (err: any) {
    console.error('Error fetching workshop resources:', err);
    return NextResponse.json(
      { error: 'Failed to load workshop resources' },
      { status: 500 }
    );
  }
}

interface WorkshopResourceInput {
  name: string;
  specialization: string;
  type: string;
  expertise: any;
  reference: {
    name: string;
    relationship: string;
    contactDetails: {
      email: string;
      phone: string;
    };
  };
  contactDetails: {
    email: string;
    phone: string;
    address: string;
  };
  availability: string;
  previousWorkshops: string;
  notes: string;
  status: string;
}

export async function POST(request: Request) {
  try {
    const data: WorkshopResourceInput = await request.json();
    
    // Transform the nested data structure to match Prisma schema
    const workshopData = {
      name: data.name,
      specialization: data.specialization,
      type: data.type,
      expertise: data.expertise,
      referenceName: data.reference.name,
      relationship: data.reference.relationship,
      referenceEmail: data.reference.contactDetails.email,
      referencePhone: data.reference.contactDetails.phone,
      contactEmail: data.contactDetails.email,
      contactPhone: data.contactDetails.phone,
      contactAddress: data.contactDetails.address,
      availability: data.availability,
      previousWorkshops: data.previousWorkshops,
      notes: data.notes,
      status: data.status
    };

    const resource = await prisma.workshopResource.create({
      data: workshopData
    });

    // Transform the response using the helper function
    const transformedResource = transformWorkshopResource(resource);

    return NextResponse.json(transformedResource);
  } catch (err: any) {
    console.error('Error creating workshop resource:', err);
    return NextResponse.json(
      { error: 'Failed to create workshop resource' },
      { status: 500 }
    );
  }
} 