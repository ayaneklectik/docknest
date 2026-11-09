import { NextResponse } from "next/server";
import { getAdminSession } from "@backend/admin-session";
import { saveSiteContent, siteContentSchema } from "@backend/site-content";

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = siteContentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Site content is incomplete or invalid." }, { status: 400 });
  }

  try {
    saveSiteContent(parsed.data, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Site content could not be saved.", error);
    return NextResponse.json({ error: "Site content could not be saved." }, { status: 500 });
  }
}
