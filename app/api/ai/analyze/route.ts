import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://frontend-lovable.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, content } = body;
    
    const textToAnalyze = text || content || "";
    
    if (!textToAnalyze) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log("🤖 Usando Gemini API para generar resumen...");
    console.log("📝 Texto a resumir (primeros 100 chars):", textToAnalyze.substring(0, 100));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `Actúa como un asistente de resumen de textos. Resume el siguiente contenido de manera breve y concisa, capturando solo los puntos clave más importantes. No agregues introducciones ni explicaciones, solo proporciona el resumen directo.

Texto original:
${textToAnalyze}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    console.log("✅ Resumen generado exitosamente");
    console.log("📊 Caracteres originales:", textToAnalyze.length);
    console.log("📊 Caracteres resumen:", summary.length);
    console.log("📊 Ratio de compresión:", ((1 - summary.length / textToAnalyze.length) * 100).toFixed(2) + "%");

    return NextResponse.json(
      { 
        ok: true, 
        data: summary,
        summary: summary,
        original: textToAnalyze 
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("❌ Error al resumir con Gemini:", err);
    return NextResponse.json(
      { error: "Error al generar el resumen" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
