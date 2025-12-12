import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Permitir solo tu frontend en producción
  // Only allow your production frontend origin explicitly
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = origin === 'https://frontend-lovable.vercel.app' ? origin : '';

  // Responder directamente a preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Para cualquier otra request, devolver normalmente con headers CORS
  const res = NextResponse.next();
    if (allowedOrigin) {
      res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    }
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'false');

  return res;
}

// Solo aplica a rutas /api/*
export const config = {
  matcher: '/api/:path*',
};
