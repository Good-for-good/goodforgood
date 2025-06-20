'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import { usePathname } from 'next/navigation';

export default function NavigationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const authPages = [
    '/login',
    '/register',
    '/registration-pending',
    '/forgot-password',
    '/reset-password'
  ];
  const isAuthPage = authPages.includes(pathname) || pathname?.startsWith('/reset-password');

  return (
    <>
      {!isAuthPage && <Navigation />}
      {children}
    </>
  );
} 