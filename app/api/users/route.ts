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

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json(
      { ok: true, data: users },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
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

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: password || "default123",
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json(
      { ok: true, data: user },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("Error creating user:", err);
    return NextResponse.json(
      {
        error: "Error creating user",
        message: err.message,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
