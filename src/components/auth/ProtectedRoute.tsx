'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission: Permission;
  fallbackUrl?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  fallbackUrl = '/'
}: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!hasPermission(requiredPermission)) {
    router.push(fallbackUrl);
    return null;
  }

  return <>{children}</>;
} 