'use client';

import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function AuthRedirect() {
  const { loading } = useAuthRedirect();

  // Show loading while checking auth state or redirecting
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto'></div>
        <p className='mt-4 text-gray-600'>
          {loading
            ? 'Checking authentication...'
            : 'Redirecting to your dashboard...'}
        </p>
      </div>
    </div>
  );
}
