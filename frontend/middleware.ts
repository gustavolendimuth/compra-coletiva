import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection
 * - /admin/* requires ADMIN role
 * - /perfil/* requires authentication
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Redirect to home with login modal trigger
      const url = request.nextUrl.clone();
      url.pathname = '/campanhas';
      url.searchParams.set('requireLogin', 'true');
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    if (userRole !== 'ADMIN') {
      // User is logged in but not admin - redirect to home
      const url = request.nextUrl.clone();
      url.pathname = '/campanhas';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  // Profile routes protection
  if (pathname.startsWith('/perfil')) {
    if (!token) {
      // Redirect to home with login modal trigger
      const url = request.nextUrl.clone();
      url.pathname = '/campanhas';
      url.searchParams.set('requireLogin', 'true');
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/perfil/:path*',
  ],
};
