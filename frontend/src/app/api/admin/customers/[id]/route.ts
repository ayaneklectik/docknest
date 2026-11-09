import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { updateCustomer } from "@backend/sales";

const customerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  company: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  country: z.string().trim().max(100),
  notes: z.string().trim().max(4000)
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("customers.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = customerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Customer information is invalid." }, { status: 400 });
  const { id } = await context.params;
  const updated = updateCustomer(id, {
    name: parsed.data.name,
    company: parsed.data.company || null,
    phone: parsed.data.phone || null,
    country: parsed.data.country || null,
    notes: parsed.data.notes
  }, session.user.id);
  return updated
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Customer not found." }, { status: 404 });
}
