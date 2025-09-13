import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/app/adapters/firebase/firebase.admin';

export async function middleware(req: NextRequest) {
  console.log(`[Middleware] Processing request for: ${req.url}`);
  
  const token = req.cookies.get('authToken')?.value;

  if (!token) {
    console.log('[Middleware] No auth token found, redirecting to /auth');
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  try {
    console.log('[Middleware] Verifying auth token...');
    await adminAuth.verifyIdToken(token);
    console.log('[Middleware] Token verified successfully, allowing access');
    return NextResponse.next();
  } catch (err) {
    console.error('[Middleware] Token verification failed:', err);
    // return NextResponse.redirect(new URL('/auth', req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'], // protect dashboard routes
};
