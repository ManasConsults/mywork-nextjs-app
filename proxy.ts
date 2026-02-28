import { withAuth } from 'next-auth/middleware';

export const proxy = withAuth;

export const config = {
  matcher: ['/dashboard/:path*', '/tasks/:path*', '/admin/:path*'],
};
