import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow access to auth callback route, home page, and auth pages
  if (
    req.nextUrl.pathname.startsWith('/auth/callback') || 
    req.nextUrl.pathname === '/' ||
    req.nextUrl.pathname === '/signin' ||
    req.nextUrl.pathname === '/signup'
  ) {
    return res;
  }

  // If user is not signed in and trying to access protected routes,
  // redirect the user to /signin
  if (!session && req.nextUrl.pathname !== '/signin' && req.nextUrl.pathname !== '/signup') {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // If user is signed in and trying to access auth pages,
  // redirect the user to /dashboard
  if (session && (req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).)*'],
}; 