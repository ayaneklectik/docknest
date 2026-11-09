import Link from "next/link";
import type { ArticleKind, ArticleRecord } from "@backend/content";

export function ArticleList({ articles, kind }: { articles: ArticleRecord[]; kind: ArticleKind }) {
  const base = kind === "blog" ? "/blog" : "/knowledge-base";
  return articles.length === 0
    ? <p className="empty-state">No {kind === "blog" ? "posts" : "articles"} have been published yet.</p>
    : <div className="article-public-list">{articles.map((article) => <article key={article.id}>
      <span className="section-kicker">{article.published_at ? new Date(article.published_at).toLocaleDateString() : "Docknest"}</span>
      <h2><Link href={`${base}/${article.slug}`}>{article.title}</Link></h2>
      <p>{article.summary}</p>
      <Link className="text-link" href={`${base}/${article.slug}`}>Read {kind === "blog" ? "article" : "guide"} ↗</Link>
    </article>)}</div>;
}
