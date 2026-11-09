import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminContent } from "@/components/admin-content";
import { getStaffSession } from "@backend/admin-session";
import { listArticles } from "@backend/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog and help content", robots: { index: false, follow: false } };

export default async function ContentPage() {
  if (!await getStaffSession("content.manage")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">PUBLISHING · BLOG & KNOWLEDGE</p><h1>Useful words,<br /><em>well kept.</em></h1></div><p>Draft, publish, and archive blog posts and self-service guides. Only published pages are visible to visitors.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Content management</div><h2>Articles</h2></div><AdminContent articles={listArticles()} /></section>
  </div>;
}
