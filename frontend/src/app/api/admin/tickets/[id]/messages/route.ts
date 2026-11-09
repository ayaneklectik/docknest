import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { addTicketMessage, listSupportMessages } from "@backend/operations";

const messageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  internal: z.boolean().default(false)
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getStaffSession("support.manage")) return NextResponse.json({ error: "Support permission required." }, { status: 403 });
  const { id } = await context.params;
  return NextResponse.json({ messages: listSupportMessages(id) });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession("support.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Reply is invalid." }, { status: 400 });
  const { id } = await context.params;
  try {
    const added = addTicketMessage(id, {
      authorId: session.user.id,
      authorName: session.user.name,
      body: parsed.data.body,
      internal: parsed.data.internal
    });
    return added
      ? NextResponse.json({ ok: true }, { status: 201 })
      : NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  } catch (error) {
    console.error("Ticket reply could not be saved.", error);
    return NextResponse.json({ error: "Ticket reply could not be saved." }, { status: 500 });
  }
}
