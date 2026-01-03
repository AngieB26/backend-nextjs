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

// GET /api/notes/[id] - Obtener una nota específica
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const note = await prisma.note.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { ok: true, data: note },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Error fetching note:", err);
    return NextResponse.json(
      { error: "Error fetching note" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// PATCH /api/notes/[id] - Actualizar nota (parcial)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, content, categoryId, isPinned } = body;

    console.log("📝 PATCH /api/notes/" + id, { title, content, categoryId, isPinned });

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    console.log("✅ Note updated:", note.id);

    return NextResponse.json(
      { ok: true, data: note },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("❌ Error updating note:", err.message);
    return NextResponse.json(
      {
        error: "Error updating note",
        message: err.message,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// PUT /api/notes/[id] - Reemplazar nota completamente
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, content, categoryId } = body;

    console.log("📝 PUT /api/notes/" + id, { title, content, categoryId });

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        categoryId: categoryId || undefined,
      },
      include: { category: true },
    });

    console.log("✅ Note replaced:", note.id);

    return NextResponse.json(
      { ok: true, data: note },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("❌ Error replacing note:", err.message);
    return NextResponse.json(
      {
        error: "Error replacing note",
        message: err.message,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// DELETE /api/notes/[id] - Eliminar nota
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    console.log("🗑️  DELETE /api/notes/" + id);

    await prisma.note.delete({
      where: { id },
    });

    console.log("✅ Note deleted:", id);

    return NextResponse.json(
      { ok: true, message: "Note deleted successfully" },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("❌ Error deleting note:", err.message);
    
    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        error: "Error deleting note",
        message: err.message,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
