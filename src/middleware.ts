import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Proxy ke backend eksternal sekarang ditangani oleh Next.js API Route Handler
// di src/app/api-proxy/[...path]/route.ts (runtime = 'nodejs').
//
// Middleware Edge Runtime TIDAK bisa proxy ke HTTPS eksternal secara reliable
// karena tidak mendukung full TCP socket — menyebabkan ECONNRESET / socket hang up.
//
// Middleware ini hanya pass-through agar request /api-proxy/* diteruskan ke Route Handler.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: '/api-proxy/:path*',
};
