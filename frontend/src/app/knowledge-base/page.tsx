import type { Metadata } from "next";
import { ArticleList } from "@/components/article-list";
import { listPublishedArticles } from "@backend/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge Base", description: "Guides and answers from Docknest." };

export default function KnowledgeBasePage() {
  return <div className="page-shell">
    <section className="page-hero compact-hero"><p className="eyebrow">HELP & REFERENCE</p><h1>Good answers,<br /><em>within reach.</em></h1><p className="hero-lede">Browse practical guides and service information from the Docknest team.</p></section>
    <section className="content-section"><ArticleList articles={listPublishedArticles("knowledge")} kind="knowledge" /></section>
  </div>;
}
