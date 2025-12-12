import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';

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
    JSON.stringify({ ok: true, route: 'search', method: 'GET' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getCORSOrigin(origin),
      },
    }
  );
}

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const searchSchema = z.object({
  query: z.string().min(1, 'La consulta no puede estar vacía'),
  userId: z.string(),
  limit: z.number().min(1).max(20).optional().default(5),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || 'http://localhost:8080';
  try {
    const body = await request.json();
    const { query, userId, limit } = searchSchema.parse(body);

    // Obtener todas las notas del usuario
    const userNotes = await prisma.note.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limitar para no sobrecargar
    });

    if (userNotes.length === 0) {
      return withCors({ success: true, results: [], message: 'No tienes notas guardadas aún' }, undefined, origin);
    }

    interface NoteWithCategory {
      title: string;
      content: string | null;
      category: { name: string };
    }

    // Crear contexto con las notas
    const notesContext = userNotes.map((note: NoteWithCategory, idx: number) => 
      `[${idx}] Título: ${note.title}\nCategoría: ${note.category.name}\nContenido: ${note.content || 'Sin contenido'}\n`
    ).join('\n---\n');

    const prompt = `Busca en las siguientes notas del usuario las que sean más relevantes para esta consulta: "${query}"

Notas disponibles:
${notesContext}

Identifica los índices de las notas más relevantes (máximo ${limit}) y explica brevemente por qué cada una es relevante.
Responde en formato JSON con esta estructura:
{
  "results": [
    {"index": 0, "relevance": "explicación breve"},
    {"index": 2, "relevance": "explicación breve"}
  ]
}`;

    const completion = await getGemini().generateContent(`Eres un asistente que ayuda a buscar información relevante en notas. Responde SOLO con JSON válido.\n\n${prompt}`);
    const aiResponse = JSON.parse(completion.response.text() || '{"results":[]}');
    
    interface AIResult {
      index: number;
      relevance: string;
    }
    
    const results = aiResponse.results.map((result: AIResult) => ({
      note: userNotes[result.index],
      relevance: result.relevance,
    }));

    return withCors({ success: true, results, query }, undefined, origin);
  } catch (error) {
    console.error('Error en búsqueda con IA:', error);

    if (error instanceof z.ZodError) {
      return withCors({ success: false, error: 'Datos de entrada inválidos', details: error.issues }, { status: 400 }, origin);
    }

    return withCors({ success: false, error: 'Error al realizar la búsqueda' }, { status: 500 }, origin);
  }
}
