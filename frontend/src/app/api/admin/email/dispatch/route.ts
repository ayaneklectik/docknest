import { NextResponse } from "next/server";
import { getStaffSession } from "@backend/admin-session";
import { dispatchQueuedEmails } from "@backend/email";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await getStaffSession("email.manage");
  if (!session) return NextResponse.json({ error: "Email-management permission required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const result = await dispatchQueuedEmails(1);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email dispatch failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
