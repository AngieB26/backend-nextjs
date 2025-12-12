import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/app/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return corsOptions(origin);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  return corsResponse(
    {
      name: 'MindNote API',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      endpoints: {
        ai: {
          analyze: '/api/ai/analyze',
          chat: '/api/ai/chat',
          generate: '/api/ai/generate',
          search: '/api/ai/search'
        }
      }
    },
    { origin }
  );
}
