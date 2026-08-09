import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get('playpay_session')?.value;
  const session = await verifySessionToken(sessionToken);

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/reset-password');

  const isAdminRoute = pathname.startsWith('/admin');
  const isTeamLeaderRoute = pathname.startsWith('/team-leader') && pathname !== '/team-leader/unauthorized';
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isMyTasksRoute = pathname.startsWith('/my-tasks');
  const isPaymentRoute = pathname.startsWith('/payment');
  const isProfileRoute = pathname.startsWith('/profile');

  const isProtectedRoute =
    isAdminRoute ||
    isTeamLeaderRoute ||
    isDashboardRoute ||
    isMyTasksRoute ||
    isPaymentRoute ||
    isProfileRoute;

  // 1. Unauthenticated users attempting to access protected routes
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-specific protection for authenticated users
  if (session) {
    // Admin routes require 'admin' role
    if (isAdminRoute) {
      if (session.role !== 'admin') {
        return NextResponse.redirect(new URL('/forbidden', request.url));
      }
    }

    // Team Leader routes require 'team_leader' memberType or 'admin' / 'team_leader' role
    if (isTeamLeaderRoute) {
      const isLeader =
        session.memberType === 'team_leader' ||
        session.role === 'team_leader' ||
        session.role === 'admin';

      if (!isLeader) {
        return NextResponse.redirect(new URL('/team-leader/unauthorized', request.url));
      }
    }

    // Authenticated users visiting auth routes (login/register) get redirected to dashboard
    if (isAuthRoute) {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

