import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
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
  return corsResponse({ ok: true, route: 'generate', method: 'GET' }, { origin });
}

const generateSchema = z.object({
  prompt: z.string().min(1, 'El prompt no puede estar vacío'),
  type: z.enum(['note', 'idea', 'task', 'outline', 'expand']),
  category: z.enum(['Ideas', 'Tareas', 'Reuniones', 'Personal', 'Trabajo']).optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
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

    return corsResponse({ success: true, content: generatedContent, type }, { origin });
  } catch (error) {
    console.error('Error al generar contenido:', error);

    if (error instanceof z.ZodError) {
      return corsResponse(
        { success: false, error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400, origin }
      );
    }

    return corsResponse(
      { success: false, error: 'Error al generar contenido' },
      { status: 500, origin }
    );
  }
}
