import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://frontend-mindnote.vercel.app",
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
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { ok: true, data: categories },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json(
      { error: "Error fetching categories" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color || "#3B82F6",
        icon: icon || "📌",
      },
    });

    return NextResponse.json(
      { ok: true, data: category },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Error creating category:", err);
    return NextResponse.json(
      { error: "Error creating category" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
