'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member } from '@/types';

interface NotificationContextType {
  pendingApprovals: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/members?status=pending', {
        headers: { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch pending approvals:', response.status, response.statusText);
        setPendingApprovals(0);
        return;
      }
      
      const data = await response.json();
      
      // Validate response data structure
      if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
        console.error('Invalid response data format:', data);
        setPendingApprovals(0);
        return;
      }

      // Extract members array safely
      let pendingMembers: Member[] = [];
      if (Array.isArray(data)) {
        pendingMembers = data;
      } else if (data.members && Array.isArray(data.members)) {
        pendingMembers = data.members;
      } else {
        console.error('Invalid members data structure:', data);
        setPendingApprovals(0);
        return;
      }
      
      // Count only valid pending members
      const pendingCount = pendingMembers.filter((member: Member) => 
        member && 
        member.accountStatus === 'pending' && 
        !member.trusteeRole
      ).length;
      
      // Only update state if count is different
      if (pendingCount !== pendingApprovals) {
        setPendingApprovals(pendingCount);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovals(0);
    }
  };

  const refreshNotifications = async () => {
    await fetchPendingApprovals();
  };

  useEffect(() => {
    fetchPendingApprovals();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchPendingApprovals, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ pendingApprovals, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 