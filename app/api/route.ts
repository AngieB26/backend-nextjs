import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGIN = 'https://frontend-lovable.vercel.app';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const allowed = origin === ALLOWED_ORIGIN ? origin : '';

  return new NextResponse(null, {
    status: 204,
    headers: {
      ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const allowed = origin === ALLOWED_ORIGIN ? origin : '';

  const body = {
    name: 'MindNote API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      ai: {
        analyze: '/api/ai/analyze',
        chat: '/api/ai/chat',
        generate: '/api/ai/generate',
        search: '/api/ai/search'
      }
    }
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
    },
  });
}
