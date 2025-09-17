import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-simple';

export function useAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

        // Add delay if redirecting from login page to allow success notification to show
        const isFromLoginPage = pathname === '/auth/login';
        const redirectDelay = isFromLoginPage ? 1500 : 0;

        setTimeout(() => {
          if (user.role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/teacher/dashboard');
          }
        }, redirectDelay);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user, loading, router, pathname]);

  return { user, loading };
}
