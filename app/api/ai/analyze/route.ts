import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { sanitizeInput, checkRateLimit, getRateLimitIdentifier } from '../../../lib/security';
import { withSecureCors } from '../../../lib/middleware';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({ apiKey });
}

const analyzeSchema = z.object({
  text: z.string().min(1, 'El texto no puede estar vacío').max(10000, 'El texto es demasiado largo'),
  type: z.enum(['summary', 'sentiment', 'category', 'keywords', 'improve']),
});

const CORS_ORIGIN = 'http://localhost:8080';

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
    JSON.stringify({ ok: true, route: 'analyze', method: 'GET' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': CORS_ORIGIN,
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // ============== RATE LIMITING ==============
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
    });

    if (!rateLimit.allowed) {
      return withSecureCors(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: new Date(rateLimit.resetTime).toISOString(),
        },
        { status: 429 },
        CORS_ORIGIN
      );
    }

    // ============== PARSE AND VALIDATE ==============
    const body = await request.json();
    const { text, type } = analyzeSchema.parse(body);

    // ============== SANITIZE INPUT ==============
    const sanitizedText = sanitizeInput(text);

    let prompt = '';
    const systemPrompt = 'Eres un asistente inteligente para la aplicación MindNote que ayuda a los usuarios a organizar sus notas.';

    switch (type) {
      case 'summary':
        prompt = `Resume el siguiente texto de manera concisa y clara en español:\n\n${sanitizedText}`;
        break;
      case 'sentiment':
        prompt = `Analiza el sentimiento del siguiente texto y clasifícalo como: positivo, negativo, neutral o mixto. Proporciona también una breve explicación:\n\n${sanitizedText}`;
        break;
      case 'category':
        prompt = `Basándote en el siguiente texto, sugiere la mejor categoría entre: Ideas, Tareas, Reuniones, Personal, Trabajo. Responde solo con el nombre de la categoría y una breve justificación:\n\n${sanitizedText}`;
        break;
      case 'keywords':
        prompt = `Extrae las palabras clave más importantes del siguiente texto. Lista máximo 5 palabras clave en español:\n\n${sanitizedText}`;
        break;
      case 'improve':
        prompt = `Mejora el siguiente texto haciéndolo más claro, conciso y profesional. Mantén el significado original:\n\n${sanitizedText}`;
        break;
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = completion.choices[0].message.content;

    return withSecureCors(
      { success: true, result, type, usage: completion.usage },
      {
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        },
      },
      CORS_ORIGIN
    );
  } catch (error) {
    console.error('Error en análisis de IA:', error);

    if (error instanceof z.ZodError) {
      return withSecureCors(
        { success: false, error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 },
        CORS_ORIGIN
      );
    }

    return withSecureCors(
      { success: false, error: 'Error al procesar la solicitud de IA' },
      { status: 500 },
      CORS_ORIGIN
    );
  }
}
