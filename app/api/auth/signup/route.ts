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
    const { email, name, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: true, data: existingUser, isNew: false },
        { headers: CORS_HEADERS }
      );
    }

    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: password || "default123",
      },
    });

    return NextResponse.json(
      { ok: true, data: user, isNew: true },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("Error in signup:", err);
    return NextResponse.json(
      { error: "Error during signup", message: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET() {
  try {
    // Obtener o crear un usuario de demostración
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "demo@example.com",
          name: "Demo User",
          password: "demo123",
        },
      });
    }

    return NextResponse.json(
      { ok: true, data: user, message: "Demo user loaded or created" },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("Error getting demo user:", err);
    return NextResponse.json(
      { error: "Error loading user", message: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
