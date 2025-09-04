import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-simple';

export function useAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (!loading && !hasRedirected.current && isMounted) {
      if (!user) {
        // If not authenticated, redirect to login
        hasRedirected.current = true;
        router.push('/auth/login');
      } else {
        // If authenticated, redirect based on role
        hasRedirected.current = true;
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/teacher/dashboard');
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user, loading, router]);

  return { user, loading };
}
