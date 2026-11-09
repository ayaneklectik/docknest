import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { ticketPriorities, ticketStatuses, updateTicket } from "@backend/operations";

const triageSchema = z.object({
  status: z.enum(ticketStatuses),
  priority: z.enum(ticketPriorities),
  assignedTo: z.string().min(1).max(128).nullable()
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession("support.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = triageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ticket update is invalid." }, { status: 400 });
  const { id } = await context.params;
  try {
    const updated = updateTicket(id, {
      status: parsed.data.status,
      priority: parsed.data.priority,
      assignedTo: parsed.data.assignedTo
    }, session.user.id);
    return updated
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ticket update failed." }, { status: 400 });
  }
}
