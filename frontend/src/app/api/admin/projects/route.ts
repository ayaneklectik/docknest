import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { createProject } from "@backend/operations";

const projectSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).default(""),
  dueAt: z.iso.date().nullable().default(null)
});

export async function POST(request: Request) {
  const session = await getStaffSession("projects.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = projectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Project details are invalid." }, { status: 400 });
  try {
    const id = createProject({
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueAt: parsed.data.dueAt
    }, session.user.id);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
