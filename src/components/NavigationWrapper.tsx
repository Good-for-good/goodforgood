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
  const isLoginPage = pathname === '/login';

  return (
    <>
      {!isLoginPage && <Navigation />}
      {children}
    </>
  );
} 