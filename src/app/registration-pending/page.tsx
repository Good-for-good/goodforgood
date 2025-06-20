'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaHourglassHalf } from 'react-icons/fa';

export default function RegistrationPendingPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="relative w-80 h-80">
            <Image
              src="/images/Logo only PNG FULL.png"
              alt="Good for Good Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
        
        <div className="flex justify-center">
          <FaHourglassHalf className="h-12 w-12 text-yellow-600 animate-pulse" />
        </div>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registration Pending
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Thank you for registering! Your account is pending approval from an administrator.
            You will receive an email notification once your account has been approved.
          </p>
        </div>

        <div className="mt-4">
          <Link
            href="/login"
            className="text-yellow-600 hover:text-yellow-500 font-medium"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
} 