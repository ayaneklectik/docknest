import { NextResponse } from "next/server";
import { getStaffSession } from "@backend/admin-session";
import { retryEmail } from "@backend/email";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession("email.manage");
  if (!session) return NextResponse.json({ error: "Email-management permission required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id } = await context.params;
  return retryEmail(id)
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Only a failed email can be retried." }, { status: 409 });
}
