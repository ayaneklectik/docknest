import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@backend/site-content";

export const metadata: Metadata = {
  title: "About Docknest",
  description: "Docknest is an emerging hosting and digital solutions company working from Bangladesh for international customers."
};

export default function AboutPage() {
  const { about } = getSiteContent().pages;
  return (
    <div className="page-shell">
      <section className="page-hero">
        <p className="eyebrow"><span className="status-dot" /> {about.eyebrow}</p>
        <h1>{about.lineOne}<br />{about.lineTwo} <em>{about.accent}</em></h1>
        <p className="hero-lede">{about.description}</p>
      </section>
      <section className="content-section split-content"><div><div className="section-kicker">{about.storyKicker}</div><h2>{about.storyTitle}</h2></div><div><p>{about.storyParagraphOne}</p><p>{about.storyParagraphTwo}</p><Link className="text-link" href="/quote">Start a conversation <span aria-hidden="true">↗</span></Link></div></section>
      <section className="content-section values-grid">{about.values.map((value, index) => <article key={`${value.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><h2>{value.title}</h2><p>{value.description}</p></article>)}</section>
      <section className="content-section"><div className="notice-box"><strong>An emerging business</strong><p>Docknest is not yet formally registered. Business registration details, legal terms, and service commitments must be reviewed and completed before commercial launch.</p></div></section>
    </div>
  );
}
