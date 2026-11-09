import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@backend/admin-session";
import {
  deleteManagedUser,
  managedUserRoleSchema,
  updateManagedUserRole
} from "@backend/admin-users";

const userIdSchema = z.string().uuid();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const id = userIdSchema.safeParse((await params).id);
  const body = z.object({ role: managedUserRoleSchema }).safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) {
    return NextResponse.json({ error: "Choose a valid user and account role." }, { status: 400 });
  }

  try {
    if (!updateManagedUserRole(id.data, body.data.role, session.user.id)) {
      return NextResponse.json({ error: "The user was not found or your own account cannot be changed here." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "The last administrator cannot be demoted.") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("User role could not be changed.", error);
    return NextResponse.json({ error: "User role could not be changed." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const id = userIdSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "Choose a valid user." }, { status: 400 });

  try {
    if (!deleteManagedUser(id.data, session.user.id)) {
      return NextResponse.json({ error: "The user was not found or your own account cannot be deleted here." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "The last administrator cannot be deleted.") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("User account could not be deleted.", error);
    return NextResponse.json({ error: "User account could not be deleted." }, { status: 500 });
  }
}
