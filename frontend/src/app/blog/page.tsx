import type { Metadata } from "next";
import { ArticleList } from "@/components/article-list";
import { listPublishedArticles } from "@backend/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog", description: "Updates and useful ideas from Docknest." };

export default function BlogPage() {
  return <div className="page-shell">
    <section className="page-hero compact-hero"><p className="eyebrow">DOCKNEST JOURNAL</p><h1>Ideas for what<br /><em>comes next.</em></h1><p className="hero-lede">Notes on hosting, product craft, and building a more dependable web.</p></section>
    <section className="content-section"><ArticleList articles={listPublishedArticles("blog")} kind="blog" /></section>
  </div>;
}
