import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Performance optimizations for middleware
const BYPASS_PATHS = new Set([
  '/manifest.json',
  '/sw.js',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap.xml',
  '/_next/static',
  '/_next/image',
  '/icons/',
  '/public/',
]);

const AUTH_PATHS = new Set(['/auth', '/api/auth']);

const sessionCache = new Map<string, { user: unknown; expires: number }>();
const CACHE_DURATION = 60000; // 1 minute
=======
  const isAuthPath =
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/';

  const hasSessionCookie = request.cookies
    .getAll()
    .some(cookie => cookie.name.startsWith('sb-'));

  if (!hasSessionCookie) {
    if (!isAuthPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }


// Rate limiting for auth requests
const authAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_AUTH_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = authAttempts.get(ip);

  if (!attempt || now > attempt.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }


  if (attempt.count >= MAX_AUTH_ATTEMPTS) {
    return false;
  }

  attempt.count++;
  return true;
}

function getCachedSession(sessionKey: string) {
  const cached = sessionCache.get(sessionKey);
  if (cached && Date.now() < cached.expires) {
    return cached.user;
  }
  sessionCache.delete(sessionKey);
  return null;
}

function setCachedSession(sessionKey: string, user: unknown) {
  sessionCache.set(sessionKey, {
    user,
    expires: Date.now() + CACHE_DURATION,
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const startTime = performance.now();

  // Skip middleware for static assets and known bypass paths for performance
  if (
    BYPASS_PATHS.has(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Rate limiting for authentication routes
  const clientIP =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (pathname.startsWith('/auth') && !checkRateLimit(clientIP)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // Create response once and reuse
  let supabaseResponse = NextResponse.next({ request });

  try {
    // Check cache first for performance
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;
    const sessionKey = accessToken ? `${accessToken.substring(0, 32)}` : '';

    let user = null;

    if (sessionKey) {
      user = getCachedSession(sessionKey);
    }

    if (!user && (accessToken || refreshToken)) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              // Batch cookie operations for better performance
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              supabaseResponse = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      // Optimized user authentication with timeout and caching
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 2000) // Reduced timeout
      );

      try {
        const {
          data: { user: authUser },
        } = (await Promise.race([userPromise, timeoutPromise])) as {
          data: { user: unknown };
        };
        user = authUser;

        // Cache successful auth
        if (user && sessionKey) {
          setCachedSession(sessionKey, user);
        }
      } catch {
        // On auth timeout or error, continue without user for client-side handling
        // console.warn('Auth error in middleware:', authError);
      }
    }

    // Fast path check for authenticated routes
    const isAuthPath = AUTH_PATHS.has(
      pathname.split('/').slice(0, 2).join('/')
    );
    const isHomePage = pathname === '/';

    if (!user && !isAuthPath && !isHomePage) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    // Add performance headers for monitoring
    const processingTime = performance.now() - startTime;
    supabaseResponse.headers.set(
      'X-Middleware-Time',
      `${processingTime.toFixed(2)}ms`
    );

    return supabaseResponse;
  } catch {
    // On critical error, let requests through to handle client-side
    // console.error('Critical middleware error:', error);

    // Add error header for debugging
    supabaseResponse.headers.set('X-Middleware-Error', 'true');
    return supabaseResponse;
  }
}

// Cleanup function to prevent memory leaks
setInterval(() => {
  const now = Date.now();

  // Clean expired sessions
  for (const [key, value] of sessionCache.entries()) {
    if (now > value.expires) {
      sessionCache.delete(key);
    }
  }

  // Clean expired rate limit entries
  for (const [key, value] of authAttempts.entries()) {
    if (now > value.resetTime) {
      authAttempts.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
