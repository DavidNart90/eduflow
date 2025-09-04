import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function parseSessionCookie(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    try {
      return JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }
}

function decodeJwt(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
    );
    return payload as { sub?: string; exp?: number };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isAuthPath =
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api/auth');

  const sessionCookie = request.cookies
    .getAll()
    .find(cookie => cookie.name.startsWith('sb-'));

  if (!sessionCookie) {
    if (!isAuthPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const session = parseSessionCookie(sessionCookie.value);
  const accessToken =
    session?.access_token ?? session?.currentSession?.access_token;
  const expiresAt =
    session?.expires_at ?? session?.currentSession?.expires_at ?? 0;

  const decoded = accessToken ? decodeJwt(accessToken) : null;
  const userId = decoded?.sub;
  const expired = !decoded?.exp
    ? true
    : Date.now() >= (expiresAt ? expiresAt * 1000 : decoded.exp * 1000);

  if (!userId || expired) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isAuthPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teacher/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
