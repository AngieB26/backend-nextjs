import { NextResponse } from "next/server";

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
    
    // Devolver exactamente lo que recibimos para debugging
    return NextResponse.json(
      {
        ok: true,
        message: "This is a debug endpoint to see what the frontend is sending",
        receivedBody: body,
        fieldAnalysis: {
          title: {
            received: body.title !== undefined,
            value: body.title,
            type: typeof body.title,
          },
          content: {
            received: body.content !== undefined,
            value: body.content,
            type: typeof body.content,
          },
          categoryId: {
            received: body.categoryId !== undefined,
            value: body.categoryId,
            type: typeof body.categoryId,
            isEmpty: body.categoryId === '' || body.categoryId === null || body.categoryId === undefined,
          },
          isPinned: {
            received: body.isPinned !== undefined,
            value: body.isPinned,
            type: typeof body.isPinned,
          },
        },
        allKeys: Object.keys(body),
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error parsing body", message: err.message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
