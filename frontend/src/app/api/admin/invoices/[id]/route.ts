import { NextResponse } from "next/server";
import { getStaffSession } from "@backend/admin-session";
import { voidInvoice } from "@backend/sales";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("invoices.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("status" in body) || body.status !== "void") {
    return NextResponse.json({ error: "Only an unpaid invoice can be voided." }, { status: 400 });
  }
  const { id } = await context.params;
  const updated = voidInvoice(id, session.user.id);
  return updated
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Invoice is missing or is no longer voidable." }, { status: 409 });
}
