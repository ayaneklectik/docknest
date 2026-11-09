import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@backend/admin-session";
import { resetManagedUserPassword } from "@backend/admin-users";

const userIdSchema = z.string().uuid();
const passwordSchema = z.object({ password: z.string().min(14).max(128) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const id = userIdSchema.safeParse((await params).id);
  const body = passwordSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) {
    return NextResponse.json({ error: "Choose a valid user and a password of at least 14 characters." }, { status: 400 });
  }

  try {
    if (!await resetManagedUserPassword(id.data, body.data.password, session.user.id)) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "This user does not have a password-based account.") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("User password could not be reset.", error);
    return NextResponse.json({ error: "User password could not be reset." }, { status: 500 });
  }
}
