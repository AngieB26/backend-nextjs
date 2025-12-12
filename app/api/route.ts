import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
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
  });
}
