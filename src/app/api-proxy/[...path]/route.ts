import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

export const runtime = 'nodejs';
export const maxDuration = 30;

function performProxyRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  bodyBuffer?: Buffer
): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const agent = isHttps
      ? new https.Agent({ keepAlive: true, rejectUnauthorized: false })
      : new http.Agent({ keepAlive: true });

    const options: any = {
      method: method,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      headers: headers,
      agent: agent
    };
    if (isHttps) {
      options.rejectUnauthorized = false;
    }

    const client = isHttps ? https : http;
    const req = client.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const resHeaders: Record<string, string> = {};
        Object.entries(res.headers).forEach(([key, val]) => {
          if (val !== undefined) {
            resHeaders[key] = Array.isArray(val) ? val.join(', ') : val;
          }
        });
        resolve({
          status: res.statusCode || 200,
          headers: resHeaders,
          body: Buffer.concat(chunks)
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path ?? [];

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!backendBaseUrl) {
    return new NextResponse('Backend URL not configured', { status: 500 });
  }

  const backendPath = '/api/' + pathSegments.join('/');
  const backendUrl = new URL(backendPath + request.nextUrl.search, backendBaseUrl);
  
  let targetUrl = backendUrl.toString();
  // Map external domains to local ports when running server-side to avoid loopback and TLS issues
  if (process.env.NODE_ENV !== 'development') {
    if (targetUrl.includes('api.nalara.academy')) {
      targetUrl = targetUrl.replace('https://api.nalara.academy', 'http://127.0.0.1:1000');
    } else if (targetUrl.includes('staging.nalara.academy')) {
      targetUrl = targetUrl.replace('https://staging.nalara.academy', 'http://127.0.0.1:1001')
                           .replace('http://staging.nalara.academy', 'http://127.0.0.1:1001');
    }
  }
  
  console.log(`[api-proxy-debug] Proxying ${request.method} to: ${targetUrl} (original: ${backendUrl.toString()})`);

  const requestHeaders = new Headers();
  
  // Forward only specific headers, or copy all except connection/host/content-length for non-body methods
  const headersToSkip = [
    'host',
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'accept-encoding', // Let server respond without compression so we don't have to compress/decompress
  ];

  request.headers.forEach((value, key) => {
    if (!headersToSkip.includes(key.toLowerCase())) {
      requestHeaders.set(key, value);
    }
  });

  // Inject server-side API key
  const secretApiKey = process.env.SECRET_API_KEY;
  if (secretApiKey) {
    requestHeaders.set('x-api-key', secretApiKey);
  }

  try {
    const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(request.method);
    if (!isBodyMethod) {
      requestHeaders.delete('content-length');
      requestHeaders.delete('content-type');
    }

    let bodyBuffer: Buffer | undefined = undefined;
    if (isBodyMethod) {
      const arrayBuffer = await request.arrayBuffer();
      bodyBuffer = Buffer.from(arrayBuffer);
    }

    const requestHeadersObj: Record<string, string> = {};
    requestHeaders.forEach((value, key) => {
      requestHeadersObj[key] = value;
    });

    const proxyRes = await performProxyRequest(
      targetUrl,
      request.method,
      requestHeadersObj,
      bodyBuffer
    );

    const responseHeaders = new Headers();
    Object.entries(proxyRes.headers).forEach(([key, val]) => {
      // Skip chunked transfer encoding headers and compression headers to avoid browser decompression issues
      if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-encoding') {
        responseHeaders.set(key, val);
      }
    });

    const responseBody = [204, 205, 304].includes(proxyRes.status) ? null : new Uint8Array(proxyRes.body);

    return new NextResponse(responseBody, {
      status: proxyRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[api-proxy] Error proxying ${request.method} ${targetUrl}:`, err?.message || err);
    if (err?.cause) {
      console.error(`[api-proxy] Cause:`, err.cause);
    }
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
