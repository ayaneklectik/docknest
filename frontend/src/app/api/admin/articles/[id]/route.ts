import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffSession } from "@backend/admin-session";
import { getArticleById, saveArticle } from "@backend/content";

const articleSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(500),
  body: z.string().trim().min(20).max(30_000),
  kind: z.enum(["blog", "knowledge"]),
  status: z.enum(["draft", "published", "archived"])
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession("content.manage");
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const parsed = articleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Article details are invalid." }, { status: 400 });
  const { id } = await context.params;
  if (!getArticleById(id)) return NextResponse.json({ error: "Article not found." }, { status: 404 });
  try {
    saveArticle(parsed.data, session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: articles.slug")) {
      return NextResponse.json({ error: "That article slug is already in use." }, { status: 409 });
    }
    console.error("Article could not be saved.", error);
    return NextResponse.json({ error: "Article could not be saved." }, { status: 500 });
  }
}
