import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedArticle } from "@backend/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticle("knowledge", slug);
  return article ? { title: article.title, description: article.summary || undefined } : { title: "Help article not found" };
}

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getPublishedArticle("knowledge", slug);
  if (!article) notFound();
  return <article className="page-shell public-article">
    <header className="page-hero compact-hero"><p className="eyebrow">DOCKNEST KNOWLEDGE BASE</p><h1>{article.title}</h1>{article.summary && <p className="hero-lede">{article.summary}</p>}</header>
    <div className="content-section article-body-copy">{article.body}</div>
  </article>;
}
