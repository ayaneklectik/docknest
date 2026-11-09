import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { updateQuoteProposal } from "@backend/sales";

const proposalSchema = z.object({
  currency: z.enum(["BDT", "USD"]),
  note: z.string().trim().max(2000).default(""),
  expiresAt: z.string().datetime().nullable().optional(),
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    description: z.string().trim().min(2).max(200),
    quantity: z.number().int().min(1).max(1000),
    unitAmountMinor: z.number().int().min(0).max(100_000_000_000)
  })).min(1).max(30)
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("quotes.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = proposalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid quotation proposal." }, { status: 400 });
  const { id } = await context.params;
  try {
    const updated = updateQuoteProposal(id, {
      currency: parsed.data.currency,
      note: parsed.data.note,
      expiresAt: parsed.data.expiresAt ?? null,
      items: parsed.data.items
    }, session.user.id);
    if (!updated) return NextResponse.json({ error: "Quotation is missing or cannot be edited." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Quotation proposal could not be saved.", error);
    return NextResponse.json({ error: "Quotation proposal could not be saved." }, { status: 400 });
  }
}
