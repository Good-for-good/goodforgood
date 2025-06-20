'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FaUserCircle, FaSignOutAlt, FaBars, FaTimes, FaBell } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Permission } from '@/types/auth';

interface NavItem {
  name: string;
  path: string;
  permission: Permission | null;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const { pendingApprovals } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Cleanup function for pending state updates
  useEffect(() => {
    return () => {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    };
  }, []);

  // Redirect /dashboard to /
  useEffect(() => {
    if (pathname === '/dashboard') {
      router.replace('/');
      }
  }, [pathname, router]);

  const isActive = (path: string) => {
    if ((path === '/' || path === '/dashboard') && (pathname === '/' || pathname === '/dashboard')) {
      return true;
    }
    return pathname === path;
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/', permission: null }, // null means visible to all
    { name: 'Members', path: '/members', permission: 'members.view' as Permission },
    { name: 'Trustees', path: '/trustees', permission: 'members.view' as Permission },
    { name: 'Donations', path: '/donations', permission: 'donations.view' as Permission },
    { name: 'Donors', path: '/donors', permission: 'donations.view' as Permission },
    { name: 'Expenses', path: '/expenses', permission: 'expenses.view' as Permission },
    { name: 'Activities', path: '/activities', permission: 'activities.view' as Permission },
    { name: 'Workshops', path: '/workshops', permission: 'workshops.view' as Permission },
    { name: 'Meetings', path: '/meetings', permission: 'meetings.view' as Permission },
    { name: 'Links', path: '/links', permission: 'links.view' as Permission },
    // Add logs and backup as regular nav items with settings.view permission
    { name: 'Audit Logs', path: '/audit-logs', permission: 'settings.view' as Permission },
    { name: 'Backup', path: '/backup', permission: 'settings.view' as Permission },
  ];

  // Filter navigation items based on user role
  const authorizedNavItems = useMemo(() => {
    if (!user) return [];

    const userRole = user.trusteeRole?.toLowerCase();

    // For Volunteer and General Trustee, only show specific pages
    if (userRole === 'volunteer' || userRole === 'general trustee') {
      return navItems.filter(item => 
        item.path === '/' || // Dashboard
        item.path === '/donations' ||
        item.path === '/expenses' ||
        item.path === '/activities'
      );
    }

    // For President, Vice President, and IT Team - show all pages
    if (userRole === 'president' || userRole === 'vice president' || userRole === 'it team') {
      return navItems;
    }

    // For all other roles - show all pages except logs and backup
    return navItems.filter(item => item.permission !== 'settings.view');
  }, [user]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setIsMobileMenuOpen(false);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Use window.location for a full page navigation
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return (
    <>
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-full mx-auto px-4">
          <div className="flex justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <Image
                    src="/images/logo.png"
                    alt="Good for Good Logo"
                    width={56}
                    height={56}
                    className="h-14 w-14 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="text-xl font-bold text-gray-900">Good for Good</span>
                  <span className="text-sm text-gray-600">Charitable Trust</span>
                </div>
              </Link>
            </div>

            {/* Navigation Items - Centered */}
            <div className="hidden lg:flex flex-1 justify-center">
              <div className="flex space-x-6 items-center">
                {authorizedNavItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`${
                      isActive(item.path)
                        ? 'border-yellow-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-yellow-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* User menu and logout - Fixed Right */}
            <div className="hidden lg:flex items-center space-x-4 ml-4">
              {/* Notifications */}
              {user && hasPermission('members.edit') && pendingApprovals > 0 && (
                <Link
                  href="/trustees"
                  className="relative p-2 text-gray-600 hover:text-yellow-600 transition-colors duration-200"
                >
                  <FaBell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingApprovals}
                  </span>
                </Link>
              )}
              
              {user && (
                <div className="flex items-center space-x-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.photo ? (
                    <img
                      src={user.photo}
                      alt={`${user.name}'s photo`}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="w-8 h-8 text-gray-400" />
                  )}
                  <div className="text-sm font-medium">
                    <p className="text-gray-900 font-medium">{user.name}</p>
                    <p className="text-gray-500 text-xs">{user.trusteeRole || 'Member'}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 bg-gray-50"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              {/* Mobile Notifications */}
              {user && hasPermission('members.edit') && pendingApprovals > 0 && (
                <Link
                  href="/trustees"
                  className="relative p-2 mr-2 text-gray-600 hover:text-yellow-600 transition-colors duration-200"
                >
                  <FaBell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingApprovals}
                  </span>
                </Link>
              )}
              
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <FaTimes className="block h-6 w-6" />
                ) : (
                  <FaBars className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} 
          id="mobile-menu"
        >
          <div className="pt-2 pb-3 space-y-1">
            {authorizedNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive(item.path)
                    ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile logout button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-2 pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>

          {user && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  {user.photo ? (
                    <img
                      src={user.photo}
                      alt={`${user.name}'s photo`}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.trusteeRole || 'Member'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20"></div>
    </>
  );
} 