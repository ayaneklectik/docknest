import { randomUUID } from "node:crypto";
import { db, isBusinessDatabaseReady } from "@backend/db";

export type ArticleKind = "blog" | "knowledge";
export type ArticleStatus = "draft" | "published" | "archived";
export type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  kind: ArticleKind;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function assertReady() {
  if (!isBusinessDatabaseReady()) {
    throw new Error("The Docknest database is not initialized. Run npm run db:migrate.");
  }
}

export function listPublishedArticles(kind: ArticleKind): ArticleRecord[] {
  assertReady();
  return db.prepare(
    `SELECT id, slug, title, summary, body, kind, status, published_at, created_at, updated_at
     FROM articles WHERE kind = ? AND status = 'published'
     ORDER BY published_at DESC LIMIT 200`
  ).all(kind) as ArticleRecord[];
}

export function getPublishedArticle(kind: ArticleKind, slug: string): ArticleRecord | null {
  assertReady();
  return db.prepare(
    `SELECT id, slug, title, summary, body, kind, status, published_at, created_at, updated_at
     FROM articles WHERE kind = ? AND slug = ? AND status = 'published'`
  ).get(kind, slug) as ArticleRecord | undefined ?? null;
}

export function listArticles(): ArticleRecord[] {
  assertReady();
  return db.prepare(
    `SELECT id, slug, title, summary, body, kind, status, published_at, created_at, updated_at
     FROM articles ORDER BY updated_at DESC LIMIT 500`
  ).all() as ArticleRecord[];
}

export function getArticleById(id: string): ArticleRecord | null {
  assertReady();
  return db.prepare(
    `SELECT id, slug, title, summary, body, kind, status, published_at, created_at, updated_at
     FROM articles WHERE id = ?`
  ).get(id) as ArticleRecord | undefined ?? null;
}

export function saveArticle(input: {
  slug: string;
  title: string;
  summary: string;
  body: string;
  kind: ArticleKind;
  status: ArticleStatus;
}, actorId: string, id?: string): string {
  assertReady();
  const articleId = id ?? randomUUID();
  const save = db.transaction(() => {
    if (id) {
      const existing = db.prepare("SELECT published_at FROM articles WHERE id = ?").get(id) as { published_at: string | null } | undefined;
      if (!existing) throw new Error("Article not found.");
      db.prepare(
        `UPDATE articles SET slug = ?, title = ?, summary = ?, body = ?, kind = ?, status = ?,
         published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, CURRENT_TIMESTAMP) ELSE NULL END,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(input.slug, input.title, input.summary, input.body, input.kind, input.status, input.status, id);
    } else {
      db.prepare(
        `INSERT INTO articles (id, slug, title, summary, body, kind, status, author_user_id, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)`
      ).run(articleId, input.slug, input.title, input.summary, input.body, input.kind, input.status, actorId, input.status);
    }
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'article.saved', 'article', ?, ?)`
    ).run(randomUUID(), actorId, articleId, JSON.stringify({ slug: input.slug, kind: input.kind, status: input.status }));
    return articleId;
  });
  return save();
}
