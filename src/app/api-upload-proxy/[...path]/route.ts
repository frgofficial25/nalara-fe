import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
// This prevents Next.js from throwing an error if the body exceeds the default Route Handler size limit (though streaming usually bypasses this)
export const maxDuration = 60; // Wait longer for big uploads

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  
  // Inject the API key from the server
  const secretApiKey = process.env.SECRET_API_KEY;
  if (secretApiKey) {
    requestHeaders.set('x-api-key', secretApiKey);
  }

  // Next.js Route handlers include host header by default which can cause issues with some proxies
  requestHeaders.delete('host');

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!backendBaseUrl) {
    return new NextResponse('Backend URL not configured', { status: 500 });
  }

  // Reconstruct the URL without '/api-upload-proxy' and add '/api'
  const backendPath = request.nextUrl.pathname.replace(/^\/api-upload-proxy/, '/api');
  const backendUrl = new URL(backendPath + request.nextUrl.search, backendBaseUrl);

  try {
    const fetchResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: request.body,
      // @ts-ignore - duplex half is required for streaming body in Node.js fetch
      duplex: 'half'
    });

    return new NextResponse(fetchResponse.body, {
      status: fetchResponse.status,
      headers: fetchResponse.headers,
    });
  } catch (err: any) {
    console.error('API Upload Proxy Error:', err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}
