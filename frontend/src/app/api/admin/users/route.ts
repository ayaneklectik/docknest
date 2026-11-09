import { NextResponse } from "next/server";
import { getAdminSession } from "@backend/admin-session";
import {
  createManagedUser,
  listManagedUsers,
  managedUserInputSchema
} from "@backend/admin-users";

function isEmailConflict(error: unknown): boolean {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed: user.email");
}

export async function GET() {
  if (!await getAdminSession()) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }
  try {
    return NextResponse.json({ users: listManagedUsers() });
  } catch (error) {
    console.error("User accounts could not be loaded.", error);
    return NextResponse.json({ error: "User accounts could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const parsed = managedUserInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a name, valid email, role, and password of at least 14 characters." }, { status: 400 });
  }

  try {
    const id = await createManagedUser(parsed.data, session.user.id);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (isEmailConflict(error)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("User account could not be created.", error);
    return NextResponse.json({ error: "User account could not be created." }, { status: 500 });
  }
}
