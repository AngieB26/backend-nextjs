import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({ apiKey });
}

const CORS_ORIGIN = 'http://localhost:8080';

function withCors(json: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(json, {
    ...(init ?? {}),
    headers: {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...(init?.headers ?? {}),
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET() {
  return new NextResponse(
    JSON.stringify({ ok: true, route: 'chat', method: 'GET' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': CORS_ORIGIN,
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

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;

    return withCors({ success: true, response, usage: completion.usage });
  } catch (error) {
    console.error('Error en chat de IA:', error);

    if (error instanceof z.ZodError) {
      return withCors({ success: false, error: 'Datos de entrada inválidos', details: error.issues }, { status: 400 });
    }

    return withCors({ success: false, error: 'Error al procesar el chat' }, { status: 500 });
  }
}
