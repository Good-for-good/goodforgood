import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Permission } from '@/types/auth';

// Add routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth/login',
  '/register',
  '/registration-pending',
  '/api/auth/register',
  '/api/auth/validate',
  '/forgot-password',
  '/api/auth/forgot-password',
  '/reset-password',
  '/api/auth/reset-password'
];

// Add public asset paths
const publicAssets = ['/images/', '/favicon.ico', '/animations/', '/_next/', '/static/'];

// Add routes that require specific permissions
const protectedRoutes: Record<string, Permission> = {
  '/audit-logs': 'settings.view',
  '/api/audit-logs': 'settings.view'
};

// Add routes that require President role
const presidentOnlyRoutes = ['/backup', '/api/backup'];

// Paths that require authentication
const AUTH_PATHS = ['/dashboard', '/profile', '/settings'];
// Paths that should redirect to dashboard if already authenticated
const GUEST_PATHS = ['/login', '/register', '/forgot-password'];

async function validateSessionToken(token: string, request: NextRequest): Promise<any> {
  try {
    // Get the base URL from the request
    const baseUrl = new URL('/', request.url).origin;
    
    const response = await fetch(`${baseUrl}/api/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${token}`
      },
      body: JSON.stringify({ token }),
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Session validation failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.member;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

function isPresident(member: any): boolean {
  if (!member?.trusteeRole) return false;
  const role = member.trusteeRole.toUpperCase();
  return role === 'PRESIDENT';
}

function hasPermission(member: any, requiredPermission: Permission): boolean {
  if (!member?.trusteeRole) return false;
  
  const userRole = member.trusteeRole.toLowerCase();

  // For President, Vice President, and IT Team - all permissions
  if (userRole === 'president' || userRole === 'PRESIDENT'.toLowerCase() || 
      userRole === 'vice president' || userRole === 'it team') {
    return true;
  }

  // For Volunteer and General Trustee - only basic view permissions
  if (userRole === 'volunteer' || userRole === 'general trustee') {
    const allowedPermissions = [
      'donations.view',
      'expenses.view',
      'activities.view'
    ];
    return allowedPermissions.includes(requiredPermission);
  }

  // For all other roles - all permissions except settings
  if (requiredPermission.startsWith('settings.')) {
    return false;
  }
  return true;
}

function getRequiredPermission(path: string): Permission | null {
  // Check exact matches first
  if (protectedRoutes[path]) {
    return protectedRoutes[path];
  }

  // Then check if the path starts with any protected route
  for (const [route, permission] of Object.entries(protectedRoutes)) {
    if (path.startsWith(route)) {
      return permission;
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Function to redirect to login
  const redirectToLogin = () => {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  };

  // Function to redirect to dashboard
  const redirectToDashboard = () => {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  };

  // Function to redirect to unauthorized
  const redirectToUnauthorized = () => {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  };

  try {
    // Check if path is a public route or asset
    if (publicRoutes.includes(path) || publicAssets.some(asset => path.startsWith(asset))) {
      return NextResponse.next();
    }

    // Check if path requires auth
    const requiresAuth = AUTH_PATHS.some(authPath => path.startsWith(authPath));
    const isGuestPath = GUEST_PATHS.some(guestPath => path === guestPath);
    const isPresidentRoute = presidentOnlyRoutes.some(route => path.startsWith(route));

    // If no token and path requires auth, redirect to login
    if (!token && (requiresAuth || isPresidentRoute)) {
      return redirectToLogin();
    }

    // If has token and is guest path, redirect to dashboard
    if (token && isGuestPath) {
      return redirectToDashboard();
    }

    // If path requires auth, president role, or has specific permissions, validate token
    if (requiresAuth || isPresidentRoute || getRequiredPermission(path)) {
      if (!token) {
        return redirectToLogin();
      }

      const member = await validateSessionToken(token, request);
  if (!member) {
        const res = redirectToLogin();
        res.cookies.delete('auth_token');
        return res;
      }

      // Check president role for backup routes
      if (isPresidentRoute && !isPresident(member)) {
        return redirectToUnauthorized();
  }

      // Check permissions if required
      const requiredPermission = getRequiredPermission(path);
  if (requiredPermission && !hasPermission(member, requiredPermission)) {
        return redirectToUnauthorized();
      }
    }

    // Continue with the request
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, clear cookie and redirect to login
    const res = redirectToLogin();
    res.cookies.delete('auth_token');
    return res;
  }
}

// Update the matcher configuration to include all routes
export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|public/|static/).*)',
    // Include root path
    '/',
  ],
}; 