import React from 'react';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import NavigationWrapper from '@/components/layout/NavigationWrapper';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { initializeApp } from '@/lib/init';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Initialize app
if (process.env.NODE_ENV === 'production') {
  initializeApp().catch(console.error);
}

export const metadata = {
  title: 'Good for Good Trust',
  description: 'Good for Good Trust Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
          <NavigationWrapper>
        {children}
          </NavigationWrapper>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 