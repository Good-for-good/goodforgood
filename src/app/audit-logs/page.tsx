'use client';

import React from 'react';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const AuditLogsPage: React.FC = () => {
  return (
    <ProtectedRoute requiredPermission="settings.view">
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            View all changes made to the system by users.
          </p>
        </div>
        <AuditLogViewer limit={100} />
      </div>
    </ProtectedRoute>
  );
};

export default AuditLogsPage; 
 
 