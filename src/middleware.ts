import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Hanya proses jika endpoint berawalan /api-proxy/
  if (request.nextUrl.pathname.startsWith('/api-proxy/')) {
    const requestHeaders = new Headers(request.headers);
    
    // Injeksi API Key secara server-side
    const secretApiKey = process.env.SECRET_API_KEY;
    if (secretApiKey) {
      requestHeaders.set('x-api-key', secretApiKey);
    }

    // Ambil base URL backend asli
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendBaseUrl) {
      return new NextResponse('Backend URL not configured', { status: 500 });
    }

    // Hapus '/api-proxy' dan ganti dengan '/api' untuk backend
    // Contoh: /api-proxy/auth/login -> /api/auth/login
    const backendPath = request.nextUrl.pathname.replace(/^\/api-proxy/, '/api');
    const backendUrl = new URL(backendPath + request.nextUrl.search, backendBaseUrl);

    return NextResponse.rewrite(backendUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Tentukan rute mana saja yang ditangkap middleware ini
export const config = {
  matcher: '/api-proxy/:path*',
};
