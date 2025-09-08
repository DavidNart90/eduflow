'use client';

import { useAuth } from '@/lib/auth-context-simple';
import { useEffect, useState } from 'react';

interface AuthDebugProps {
  show?: boolean;
}

export default function AuthDebugPanel({
  show = process.env.NODE_ENV === 'development',
}: AuthDebugProps) {
  const { user, loading, session } = useAuth();
  const [authHistory, setAuthHistory] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    const status = loading
      ? 'Loading'
      : user
        ? `User: ${user.email}`
        : 'No user';
    const sessionStatus = session ? 'Session active' : 'No session';

    setAuthHistory(prev => {
      const newEntry = `${timestamp}: ${status} | ${sessionStatus}`;
      return [newEntry, ...prev.slice(0, 9)]; // Keep last 10 entries
    });
  }, [user, loading, session]);

  const clearCache = () => {
    // Clear localStorage auth cache
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('auth') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  const forceRefresh = () => {
    window.location.reload();
  };

  if (!show) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className='fixed bottom-4 right-4 z-50 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600'
        style={{ fontSize: '12px' }}
      >
        🔧
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className='fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border max-w-sm'>
          <div className='flex justify-between items-center mb-3'>
            <h3 className='font-bold text-sm'>Auth Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className='text-gray-500 hover:text-gray-700'
            >
              ✕
            </button>
          </div>

          <div className='space-y-2 text-xs'>
            <div>
              <strong>Status:</strong>{' '}
              {loading
                ? '🔄 Loading'
                : user
                  ? '✅ Authenticated'
                  : '❌ Not authenticated'}
            </div>

            <div>
              <strong>User:</strong> {user ? user.email : 'None'}
            </div>

            <div>
              <strong>Role:</strong> {user?.role || 'None'}
            </div>

            <div>
              <strong>Session:</strong> {session ? '✅ Active' : '❌ None'}
            </div>

            <div>
              <strong>Session ID:</strong>{' '}
              {session?.user?.id?.slice(0, 8) || 'None'}
            </div>

            <div className='mt-3'>
              <strong>History:</strong>
              <div className='mt-1 max-h-32 overflow-y-auto text-xs'>
                {authHistory.map((entry, index) => (
                  <div
                    key={index}
                    className='py-1 border-b border-gray-200 dark:border-gray-600'
                  >
                    {entry}
                  </div>
                ))}
              </div>
            </div>

            <div className='flex space-x-2 mt-3'>
              <button
                onClick={clearCache}
                className='px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600'
              >
                Clear Cache
              </button>
              <button
                onClick={forceRefresh}
                className='px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600'
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
