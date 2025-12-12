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
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET() {
  return new NextResponse(
    JSON.stringify({ ok: true, route: 'generate', method: 'GET' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': CORS_ORIGIN,
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

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 1000,
    });

    const generatedContent = completion.choices[0].message.content;

    return withCors({ success: true, content: generatedContent, type, usage: completion.usage });
  } catch (error) {
    console.error('Error al generar contenido:', error);

    if (error instanceof z.ZodError) {
      return withCors({ success: false, error: 'Datos de entrada inválidos', details: error.issues }, { status: 400 });
    }

    return withCors({ success: false, error: 'Error al generar contenido' }, { status: 500 });
  }
}
