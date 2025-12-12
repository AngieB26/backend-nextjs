import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { corsResponse, corsOptions } from '@/app/lib/cors';

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return corsOptions(origin);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  return corsResponse({ ok: true, route: 'search', method: 'GET' }, { origin });
}

const searchSchema = z.object({
  query: z.string().min(1, 'La consulta no puede estar vacía'),
  userId: z.string(),
  limit: z.number().min(1).max(20).optional().default(5),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { query, userId, limit } = searchSchema.parse(body);

    const userNotes = await prisma.note.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (userNotes.length === 0) {
      return corsResponse(
        { success: true, results: [], message: 'No tienes notas guardadas aún' },
        { origin }
      );
    }

    interface NoteWithCategory {
      title: string;
      content: string | null;
      category: { name: string };
    }

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

    return corsResponse({ success: true, results, query }, { origin });
  } catch (error) {
    console.error('Error en búsqueda con IA:', error);

    if (error instanceof z.ZodError) {
      return corsResponse(
        { success: false, error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400, origin }
      );
    }

    return corsResponse(
      { success: false, error: 'Error al realizar la búsqueda' },
      { status: 500, origin }
    );
  }
}
