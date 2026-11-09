import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { updateDomainRequest } from "@backend/domains";

const domainUpdateSchema = z.object({
  status: z.enum(["manual_check_required", "available", "unavailable", "registered", "rejected"]),
  reference: z.string().trim().max(240).nullable().default(null)
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession("domains.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const parsed = domainUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Domain request update is invalid." }, { status: 400 });
  const { id } = await context.params;
  const updated = updateDomainRequest(id, parsed.data.status, parsed.data.reference, session.user.id);
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Domain request not found or already registered." }, { status: 409 });
}
