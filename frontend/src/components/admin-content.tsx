"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { ArticleRecord } from "@backend/content";

function articlePath(article: Pick<ArticleRecord, "kind" | "slug">) {
  return `/${article.kind === "blog" ? "blog" : "knowledge-base"}/${article.slug}`;
}

export function AdminContent({ articles: initialArticles }: { articles: ArticleRecord[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>, article?: ArticleRecord) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const payload = {
      slug: form.get("slug"),
      title: form.get("title"),
      summary: form.get("summary"),
      body: form.get("body"),
      kind: form.get("kind"),
      status: form.get("status")
    };
    try {
      const response = await fetch(article ? `/api/admin/articles/${article.id}` : "/api/admin/articles", {
        method: article ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Article could not be saved.");
        return;
      }
      if (!article) {
        element.reset();
        window.location.reload();
      } else {
        setArticles((current) => current.map((item) => item.id === article.id ? {
          ...item,
          slug: String(payload.slug),
          title: String(payload.title),
          summary: String(payload.summary),
          body: String(payload.body),
          kind: payload.kind as ArticleRecord["kind"],
          status: payload.status as ArticleRecord["status"]
        } : item));
      }
      setNotice("Article saved.");
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  function editor(article?: ArticleRecord) {
    return <form className="article-editor" key={article?.id ?? "new"} onSubmit={(event) => void save(event, article)}>
      <label>Title<input name="title" defaultValue={article?.title ?? ""} minLength={3} maxLength={180} required /></label>
      <label>URL slug<input name="slug" defaultValue={article?.slug ?? ""} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} required /></label>
      <label>Type<select name="kind" defaultValue={article?.kind ?? "knowledge"}><option value="knowledge">Knowledge base</option><option value="blog">Blog</option></select></label>
      <p className="article-placement-note">When published: Blog posts appear at /blog and may appear in the homepage journal; Knowledge Base guides appear at /knowledge-base.</p>
      <label>Status<select name="status" defaultValue={article?.status ?? "draft"}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <label className="article-summary">Summary<input name="summary" defaultValue={article?.summary ?? ""} maxLength={500} /></label>
      <label className="article-body">Article body<textarea name="body" defaultValue={article?.body ?? ""} minLength={20} maxLength={30_000} rows={8} required /></label>
      <button className="small-action" type="submit">{article ? "Save changes" : "Create article"}</button>
    </form>;
  }

  return <>
    <p className="form-message" aria-live="polite" role="status">{notice}</p>
    <details className="article-create" open={articles.length === 0}><summary>Create an article</summary>{editor()}</details>
    <div className="article-admin-list">{articles.map((article) => <details className="article-admin-card" key={article.id}>
      <summary><span><strong>{article.title}</strong><span className="table-detail">{article.kind === "blog" ? "Blog · Journal" : "Knowledge base · Help & Reference"} · {article.status} · {articlePath(article)}</span></span></summary>
      {article.status === "published" && <Link className="article-public-preview" href={articlePath(article)} target="_blank">Open public article ↗</Link>}
      {editor(article)}
    </details>)}</div>
  </>;
}
