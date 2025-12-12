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
  return corsResponse({ ok: true, route: 'chat', method: 'GET' }, { origin });
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
  const origin = request.headers.get('origin');
  
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

    return corsResponse({ success: true, response }, { origin });
  } catch (error) {
    console.error('Error en chat de IA:', error);

    if (error instanceof z.ZodError) {
      return corsResponse(
        { success: false, error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400, origin }
      );
    }

    return corsResponse(
      { success: false, error: 'Error al procesar el chat' },
      { status: 500, origin }
    );
  }
}
