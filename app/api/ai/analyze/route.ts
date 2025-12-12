import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { sanitizeInput, checkRateLimit, getRateLimitIdentifier } from '@/app/lib/security';
import { corsResponse, corsOptions } from '@/app/lib/cors';

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const analyzeSchema = z.object({
  text: z.string().min(1, 'El texto no puede estar vacío').max(10000, 'El texto es demasiado largo'),
  type: z.enum(['summary', 'sentiment', 'category', 'keywords', 'improve']),
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return corsOptions(origin);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  return corsResponse({ ok: true, route: 'analyze', method: 'GET' }, { origin });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(identifier, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimit.allowed) {
      return corsResponse(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: new Date(rateLimit.resetTime).toISOString(),
        },
        {
          status: 429,
          origin,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { text, type } = analyzeSchema.parse(body);
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

    const completion = await getGemini().generateContent(`${systemPrompt}\n\n${prompt}`);
    const result = completion.response.text();

    return corsResponse(
      { success: true, result, type },
      {
        origin,
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Error en análisis de IA:', error);

    if (error instanceof z.ZodError) {
      return corsResponse(
        { success: false, error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400, origin }
      );
    }

    return corsResponse(
      { success: false, error: 'Error al procesar la solicitud de IA' },
      { status: 500, origin }
    );
  }
}
