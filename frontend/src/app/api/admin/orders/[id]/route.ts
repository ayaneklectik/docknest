import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { updateOrderStatus } from "@backend/sales";

const statusSchema = z.object({ status: z.enum(["awaiting_payment", "cancelled"]) });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("orders.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  const { id } = await context.params;
  const changed = updateOrderStatus(id, parsed.data.status, session.user.id);
  return changed
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Order status could not be changed." }, { status: 409 });
}
