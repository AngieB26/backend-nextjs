export async function POST(req: Request) {
  try {
    const body = await req.json();
    return Response.json({ ok: true, data: body });
  } catch (err) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
