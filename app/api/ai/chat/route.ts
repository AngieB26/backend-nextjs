import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const CORS_ORIGINS = ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000', 'https://frontend-lovable.vercel.app'];

function getCORSOrigin(origin?: string): string {
  if (!origin) return CORS_ORIGINS[0];
  return CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
}

function withCors(json: Record<string, unknown>, init?: ResponseInit, origin?: string) {
  const corsOrigin = getCORSOrigin(origin);
  return NextResponse.json(json, {
    ...(init ?? {}),
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...(init?.headers ?? {}),
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || 'http://localhost:8080';
  return new NextResponse(
    JSON.stringify({ ok: true, route: 'chat', method: 'GET' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getCORSOrigin(origin),
      },
    }
  );
}

const chatSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
  context: z.string().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || 'http://localhost:8080';
  try {
    const body = await request.json();
    const { message, context, conversationHistory = [] } = chatSchema.parse(body);

    const systemPrompt = `Eres un asistente inteligente de IA para MindNote, una aplicación de toma de notas.
Ayudas a los usuarios a:
- Organizar y estructurar sus notas
- Generar ideas y contenido
- Responder preguntas sobre sus notas
- Proporcionar sugerencias útiles

Responde en español de manera clara y concisa.${context ? `\n\nContexto de las notas del usuario:\n${context}` : ''}`;

    const history = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n\n');

    const fullPrompt = `${systemPrompt}

${history ? `Historial de conversación:
${history}

` : ''}Usuario: ${message}

Asistente:`;

    const completion = await getGemini().generateContent(fullPrompt);
    const response = completion.response.text();

    return withCors({ success: true, response }, undefined, origin);
  } catch (error) {
    console.error('Error en chat de IA:', error);

    if (error instanceof z.ZodError) {
      return withCors({ success: false, error: 'Datos de entrada inválidos', details: error.issues }, { status: 400 }, origin);
    }

    return withCors({ success: false, error: 'Error al procesar el chat' }, { status: 500 }, origin);
  }
}
