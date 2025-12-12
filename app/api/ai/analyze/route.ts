import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://frontend-lovable.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ejemplo: almacenar en DB con Prisma
    // const newRecord = await prisma.message.create({ data: { text: body.mensaje } });

    return NextResponse.json(
      { ok: true, data: body },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
