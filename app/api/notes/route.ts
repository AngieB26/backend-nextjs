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
    const { title, content, categoryId, userId, isPinned } = body;

    console.log("📝 POST /api/notes - RECEIVED BODY:", JSON.stringify(body, null, 2));
    console.log("   - title:", title);
    console.log("   - content length:", content?.length || 0);
    console.log("   - categoryId:", categoryId, "(type:", typeof categoryId, ")");
    console.log("   - userId:", userId);
    console.log("   - isPinned:", isPinned);

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // categoryId es opcional, si no lo proporciona usar uno por defecto
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      console.log("   → No categoryId provided, using default 'General'");
      finalCategoryId = await getOrCreateDefaultCategory();
    } else {
      // Verificar que la categoría existe
      const categoryExists = await prisma.category.findUnique({
        where: { id: finalCategoryId },
      });
      
      if (!categoryExists) {
        console.log("   → Invalid categoryId, using default 'General'");
        finalCategoryId = await getOrCreateDefaultCategory();
      } else {
        console.log("   → Using provided categoryId:", finalCategoryId, "(" + categoryExists.name + ")");
      }
    }

    // userId es opcional - si no se proporciona, dejar como null
    const finalUserId = userId || null;

    console.log("Creating note with:", {
      title,
      content,
      categoryId: finalCategoryId,
      userId: finalUserId,
      isPinned: isPinned || false,
    });

    const note = await prisma.note.create({
      data: {
        title,
        content,
        categoryId: finalCategoryId,
        isPinned: isPinned || false,
        ...(finalUserId && { userId: finalUserId }),
      },
      include: { category: true },
    });

    console.log("✅ Note created:", note.id);

    return NextResponse.json(
      { ok: true, data: note },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("❌ Error creating note:", err.message);
    console.error("   Error code:", err.code);
    console.error("   Full error:", JSON.stringify(err, null, 2));
    
    // Error específico de Prisma para foreign key
    if (err.code === 'P2003') {
      return NextResponse.json(
        {
          error: "Invalid category ID",
          message: "The provided categoryId does not exist",
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    return NextResponse.json(
      {
        error: "Error creating note",
        message: err.message,
        code: err.code,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
