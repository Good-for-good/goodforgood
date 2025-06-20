import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/lib/services/audit';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching audit logs...');
    
    // Get auth token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    
    if (!token) {
      console.log('Unauthorized: No auth token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The middleware will handle authentication and permission checks
    // If we reach here, the user has the required permissions

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = searchParams.get('limit');
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const action = searchParams.get('action');
    const search = searchParams.get('search');

    console.log('Query params:', { entityType, entityId, limit, page, pageSize, action, search });

    let result;
    if (entityType && entityId) {
      const logs = await AuditService.getLogsForEntity(entityType, entityId);
      result = { logs, total: logs.length };
    } else {
      const offset = page && pageSize ? (parseInt(page) - 1) * parseInt(pageSize) : 0;
      result = await AuditService.getRecentLogs({
        limit: limit ? parseInt(limit) : pageSize ? parseInt(pageSize) : 50,
        offset,
        entityType: entityType || undefined,
        entityId: entityId || undefined,
        action: action || undefined,
        search: search || undefined,
      });
    }

    // Get all available entity types for the dropdown
    const entityTypes = await prisma.auditLog.findMany({
      select: {
        entityType: true,
      },
      distinct: ['entityType'],
      orderBy: {
        entityType: 'asc',
      },
    });

    console.log(`Found ${result.logs.length} audit logs (total: ${result.total})`);
    return NextResponse.json({
      ...result,
      entityTypes: entityTypes.map(et => et.entityType),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
 
 