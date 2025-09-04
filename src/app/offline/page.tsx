'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-redirect when back online
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/dashboard');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center'>
        {/* Icon */}
        <div className='mb-6'>
          {isOnline ? (
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
              <svg
                className='w-8 h-8 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          ) : (
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto'>
              <svg
                className='w-8 h-8 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M18.364 5.636L5.636 18.364m12.728 0L5.636 5.636'
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          {isOnline ? 'Back Online!' : "You're Offline"}
        </h1>

        <p className='text-gray-600 mb-6'>
          {isOnline
            ? 'Your connection has been restored. Redirecting to EduFlow...'
            : "It looks like you're not connected to the internet. Some features may not be available."}
        </p>

        {/* Online indicator */}
        <div className='flex items-center justify-center mb-6'>
          <div
            className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className='text-sm text-gray-600'>
            {isOnline ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Action button */}
        <button
          onClick={handleRetry}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isOnline
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isOnline ? 'Continue to EduFlow' : 'Try Again'}
        </button>

        {/* Offline features */}
        {!isOnline && (
          <div className='mt-8 pt-6 border-t border-gray-200'>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>
              Available Offline Features:
            </h3>
            <ul className='text-sm text-gray-600 space-y-2'>
              <li className='flex items-center'>
                <svg
                  className='w-4 h-4 text-green-500 mr-2'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                View cached dashboard content
              </li>
              <li className='flex items-center'>
                <svg
                  className='w-4 h-4 text-green-500 mr-2'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                Browse saved reports
              </li>
              <li className='flex items-center'>
                <svg
                  className='w-4 h-4 text-green-500 mr-2'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                Access help documentation
              </li>
            </ul>
          </div>
        )}

        {/* EduFlow branding */}
        <div className='mt-6 pt-6 border-t border-gray-200'>
          <p className='text-xs text-gray-500'>
            EduFlow - Teachers&apos; Portal
          </p>
        </div>
      </div>
    </div>
  );
}
