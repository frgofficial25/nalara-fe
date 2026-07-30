import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path ?? [];

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!backendBaseUrl) {
    return new NextResponse('Backend URL not configured', { status: 500 });
  }

  const backendPath = '/api/' + pathSegments.join('/');
  const backendUrl = new URL(backendPath + request.nextUrl.search, backendBaseUrl);

  const requestHeaders = new Headers(request.headers);

  // Inject server-side API key
  const secretApiKey = process.env.SECRET_API_KEY;
  if (secretApiKey) {
    requestHeaders.set('x-api-key', secretApiKey);
  }

  // Remove host header to avoid proxy issues
  requestHeaders.delete('host');

  try {
    const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(request.method);

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: requestHeaders,
      ...(isBodyMethod && {
        body: request.body,
        // @ts-ignore duplex half required for streaming body
        duplex: 'half',
      }),
    };

    const fetchResponse = await fetch(backendUrl.toString(), fetchOptions);

    const responseHeaders = new Headers(fetchResponse.headers);
    // Remove encoding headers that Next.js will re-add
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new NextResponse(fetchResponse.body, {
      status: fetchResponse.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[api-proxy] Error proxying ${request.method} ${backendUrl}:`, err?.message || err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Proxy error: ' + (err?.message || 'Unknown error') }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}
export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}
