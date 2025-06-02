import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow access to auth callback route
  if (req.nextUrl.pathname.startsWith('/auth/callback')) {
    return res;
  }

  // If user is not signed in and the current path is not /signin,
  // redirect the user to /signin
  if (!session && req.nextUrl.pathname !== '/signin') {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // If user is signed in and the current path is /signin,
  // redirect the user to /dashboard
  if (session && req.nextUrl.pathname === '/signin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 