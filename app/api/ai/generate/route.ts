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
    JSON.stringify({ ok: true, route: 'generate', method: 'GET' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getCORSOrigin(origin),
      },
    }
  );
}

const generateSchema = z.object({
  prompt: z.string().min(1, 'El prompt no puede estar vacío'),
  type: z.enum(['note', 'idea', 'task', 'outline', 'expand']),
  category: z.enum(['Ideas', 'Tareas', 'Reuniones', 'Personal', 'Trabajo']).optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || 'http://localhost:8080';
  try {
    const body = await request.json();
    const { prompt, type, category } = generateSchema.parse(body);

    const systemPrompt = 'Eres un asistente creativo para MindNote que ayuda a generar contenido útil.';
    let userPrompt = '';

    switch (type) {
      case 'note':
        userPrompt = `Genera una nota completa${category ? ` para la categoría ${category}` : ''} basándote en este tema:\n\n${prompt}\n\nIncluye un título claro y contenido bien estructurado.`;
        break;
      case 'idea':
        userPrompt = `Genera 5 ideas creativas relacionadas con:\n\n${prompt}\n\nFormatea cada idea con un título y breve descripción.`;
        break;
      case 'task':
        userPrompt = `Crea una lista de tareas detalladas para:\n\n${prompt}\n\nIncluye tareas específicas y accionables.`;
        break;
      case 'outline':
        userPrompt = `Crea un esquema estructurado para:\n\n${prompt}\n\nUsa títulos, subtítulos y puntos clave.`;
        break;
      case 'expand':
        userPrompt = `Expande y desarrolla el siguiente texto con más detalles, ejemplos y contexto:\n\n${prompt}`;
        break;
    }

    const completion = await getGemini().generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const generatedContent = completion.response.text();

    return withCors({ success: true, content: generatedContent, type }, undefined, origin);
  } catch (error) {
    console.error('Error al generar contenido:', error);

    if (error instanceof z.ZodError) {
      return withCors({ success: false, error: 'Datos de entrada inválidos', details: error.issues }, { status: 400 }, origin);
    }

    return withCors({ success: false, error: 'Error al generar contenido' }, { status: 500 }, origin);
  }
}
