import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { setAddonActive, setProductActive } from "@backend/catalog";

const updateSchema = z.object({
  type: z.enum(["product", "addon"]),
  active: z.boolean()
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession("catalog.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid catalog status." }, { status: 400 });
  const { id } = await context.params;
  const updated = parsed.data.type === "product"
    ? setProductActive(id, parsed.data.active, session.user.id)
    : setAddonActive(id, parsed.data.active, session.user.id);
  return updated
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Catalog item not found." }, { status: 404 });
}
