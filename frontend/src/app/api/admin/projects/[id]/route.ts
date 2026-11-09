import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { projectStatuses, updateProject } from "@backend/operations";

const projectSchema = z.object({
  status: z.enum(projectStatuses),
  dueAt: z.iso.date().nullable(),
  assignedTo: z.string().min(1).max(128).nullable()
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession("projects.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const parsed = projectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Project update is invalid." }, { status: 400 });
  const { id } = await context.params;
  try {
    const updated = updateProject(id, {
      status: parsed.data.status,
      dueAt: parsed.data.dueAt,
      assignedTo: parsed.data.assignedTo
    }, session.user.id);
    return updated
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Project not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Project update failed." }, { status: 400 });
  }
}
