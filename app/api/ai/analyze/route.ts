import { NextResponse } from "next/server";

// Forzar Node.js runtime
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ ok: true, data: body });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
