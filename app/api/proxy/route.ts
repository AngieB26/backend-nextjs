// app/api/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

// Forzamos Node.js runtime para que fetch funcione correctamente
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Obtenemos el body del request
    const body = await req.json();

    // Hacemos fetch al backend externo
    const response = await fetch(
      "https://backend-nextjs-one.vercel.app/api/ai/analyze",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    // Obtenemos la respuesta como JSON
    const data = await response.json();

    // Retornamos la respuesta al frontend con headers CORS
    const res = NextResponse.json(data);
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error interno en el proxy" },
      { status: 500 }
    );
  }
}

// Manejo de OPTIONS para preflight CORS
export async function OPTIONS() {
  const res = NextResponse.json({});
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
