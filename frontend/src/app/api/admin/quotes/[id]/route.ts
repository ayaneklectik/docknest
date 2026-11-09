import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { quoteStatuses } from "@/lib/quote";
import { updateQuoteStatus } from "@backend/quotes";

const statusSchema = z.object({ status: z.enum(quoteStatuses).refine((status) => status !== "converted") });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("quotes.manage");
  if (!session) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quotation status." }, { status: 400 });
  }

  const { id } = await context.params;
  const updated = updateQuoteStatus(id, parsed.data.status, session.user.id);
  if (!updated) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
