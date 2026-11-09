import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { reviewPayment } from "@backend/sales";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).default("")
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("payments.review");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment review." }, { status: 400 });
  const { id } = await context.params;
  try {
    const reviewed = reviewPayment(id, parsed.data.status, parsed.data.note, session.user.id);
    return reviewed
      ? NextResponse.json({ ok: true, serviceProvisioned: false })
      : NextResponse.json({ error: "Payment is not pending review." }, { status: 409 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment could not be reviewed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
