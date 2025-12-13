import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://frontend-lovable.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

async function getOrCreateDefaultCategory(): Promise<string> {
  let category = await prisma.category.findFirst({
    where: { name: "General" },
  });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "General",
        icon: "📌",
        color: "#3B82F6",
      },
    });
  }
  return category.id;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { ok: true, data: notes },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Error fetching notes:", err);
    return NextResponse.json(
      { error: "Error fetching notes" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, categoryId, userId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const finalUserId = userId || "anonymous-" + Date.now();

    const note = await prisma.note.create({
      data: {
        title,
        content,
        categoryId,
        userId: finalUserId,
      },
      include: { category: true },
    });

    return NextResponse.json(
      { ok: true, data: note },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Error creating note:", err);
    return NextResponse.json(
      { error: "Error creating note", details: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
