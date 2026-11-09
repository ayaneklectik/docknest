import { NextResponse } from "next/server";
import { getStaffSession } from "@backend/admin-session";
import { convertApprovedQuoteToOrder } from "@backend/sales";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("quotes.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const { id } = await context.params;
  try {
    const orderId = convertApprovedQuoteToOrder(id, session.user.id);
    return NextResponse.json({ ok: true, orderId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quotation could not be converted.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
