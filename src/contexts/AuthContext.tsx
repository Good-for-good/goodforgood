'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member, TrusteeRole } from '@/types';
import { Permission, ROLE_PERMISSIONS } from '@/types/auth';
import { TRUSTEE_ROLES } from '@/constants/roles';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Member | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check auth status on mount and when user changes
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.trusteeRole) return false;
    
    const userRole = user.trusteeRole.toLowerCase();

    // For Volunteer and General Trustee - only basic view permissions
    if (userRole === 'volunteer' || userRole === 'general trustee') {
      const allowedPermissions = [
        'donations.view',
        'expenses.view',
        'activities.view'
      ];
      return allowedPermissions.includes(permission);
    }

    // For President, Vice President, and IT Team - all permissions
    if (userRole === 'president' || userRole === 'vice president' || userRole === 'it team') {
      return true;
    }

    // For all other roles - all permissions except settings
    if (permission.startsWith('settings.')) {
      return false;
    }
    return true;
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      
      // Set user state
      setUser(data.user);
      
      // Wait a moment for the cookie to be properly set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify the session with multiple retries
      let verifiedUser = null;
      for (let i = 0; i < 3; i++) {
        try {
          const verifyResponse = await fetch('/api/auth/me', {
            credentials: 'same-origin',
            cache: 'no-store'
          });
          
          if (verifyResponse.ok) {
            verifiedUser = await verifyResponse.json();
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error('Session verification attempt failed:', err);
        }
      }
      
      if (!verifiedUser) {
        throw new Error('Failed to establish session');
      }
      
      // Update user state with verified data
      setUser(verifiedUser);
      
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Important for cookie handling
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      
      // Clear any cached data
      router.refresh();
      
      // Redirect to login
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        hasPermission,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 