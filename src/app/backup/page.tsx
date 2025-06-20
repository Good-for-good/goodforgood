'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600"></div>
  </div>
);

// Use dynamic import with no SSR for the client component
const BackupManager = dynamic(
  () => import('@/components/backup/BackupManager').catch(err => {
    console.error('Error loading BackupManager:', err);
    return () => (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Failed to load backup manager. Please try refreshing the page.
      </div>
    );
  }),
  {
    ssr: false,
    loading: () => <LoadingSpinner />
  }
);

const BackupPage: React.FC = () => {
  return (
    <ProtectedRoute requiredPermission="settings.view">
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Backup Management</h1>
          <p className="text-muted-foreground">
            Manage system backups and restore points.
          </p>
        </div>
        <Suspense fallback={<LoadingSpinner />}>
          <BackupManager />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
};

export default BackupPage; 