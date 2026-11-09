import Link from "next/link";
import Image from "next/image";
import type { SiteContent } from "@backend/site-content";

type ShowcaseCardContent = SiteContent["home"]["showcaseCards"][number];
type ShowcaseType = ShowcaseCardContent["type"];

function ShowcaseArtwork({ type }: { type: ShowcaseType }) {
  if (type === "hosting") {
    return (
      <div className="showcase-art art-hosting" aria-hidden="true">
        <div className="art-grid" />
        <div className="server-stack">
          <div className="server-top"><span>DOCKNEST / NODE 01</span><i /></div>
          <div className="server-unit"><span /><span /><span /></div>
          <div className="server-unit"><span /><span /><span /></div>
          <div className="server-unit"><span /><span /><span /></div>
          <div className="server-base" />
        </div>
        <div className="art-float float-status"><i /> Built to grow <b>↗</b></div>
        <div className="art-orbit orbit-a" />
        <div className="art-orbit orbit-b" />
      </div>
    );
  }

  if (type === "web") {
    return (
      <div className="showcase-art art-web" aria-hidden="true">
        <div className="art-grid" />
        <div className="browser-window">
          <div className="browser-bar"><i /><i /><i /><span>yourbrand.com</span></div>
          <div className="browser-content">
            <div className="browser-brand">NORTH / STUDIO</div>
            <div className="browser-headline">MAKE ROOM<br />FOR MORE.</div>
            <div className="browser-button">EXPLORE THE COLLECTION <span>↗</span></div>
            <div className="browser-image"><i /><b /></div>
          </div>
        </div>
        <div className="art-float float-live"><i /> A little more you.</div>
      </div>
    );
  }

  if (type === "domains") {
    return (
      <div className="showcase-art art-domains" aria-hidden="true">
        <div className="art-grid" />
        <div className="domain-glow" />
        <div className="domain-orb"><span>.com</span></div>
        <div className="domain-chip domain-chip-one"><i /> youridea.com <b>Available</b></div>
        <div className="domain-chip domain-chip-two">.studio <span>↗</span></div>
        <div className="domain-chip domain-chip-three">.online <span>↗</span></div>
        <div className="domain-cross">✳</div>
      </div>
    );
  }

  return (
    <div className="showcase-art art-support" aria-hidden="true">
      <div className="art-grid" />
      <div className="support-window">
        <div className="support-heading"><span className="support-avatar">d.</span><span><b>Docknest support</b><small>Here to help</small></span><i /></div>
        <div className="chat-bubble bubble-in">Hi! How can we help with your site?</div>
        <div className="chat-bubble bubble-out">I’m ready to get started.</div>
        <div className="chat-bubble bubble-in bubble-short">Let’s figure it out together.</div>
        <div className="chat-compose">Write a message <span>↑</span></div>
      </div>
      <div className="art-float float-human">Real people. Clear answers.</div>
    </div>
  );
}

function ShowcaseCard({ card, decorative = false }: {
  card: ShowcaseCardContent;
  decorative?: boolean;
}) {
  return (
    <Link
      className={`showcase-card showcase-${card.type}`}
      href={card.href}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
    >
      <ShowcaseArtwork type={card.type} />
      {card.imageUrl && <Image className="showcase-uploaded-image" src={card.imageUrl} alt={card.title} fill sizes="(max-width: 680px) 285px, (max-width: 960px) 320px, 370px" unoptimized />}
      <div className="showcase-caption">
        <div><span>{card.category}</span><h3>{card.title}</h3><p>{card.description}</p></div>
        <span className="showcase-arrow" aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}

function ShowcaseTrack({ cards, reverse = false }: { cards: ShowcaseCardContent[]; reverse?: boolean }) {
  const trackCards = reverse ? [...cards].reverse() : cards;

  return (
    <div className={`showcase-track${reverse ? " showcase-track-reverse" : ""}`}>
      {[false, true].map((decorative) => (
        <div
          className="showcase-group"
          key={decorative ? "duplicate" : "original"}
          aria-hidden={decorative || undefined}
        >
          {trackCards.map((card, index) => (
            <ShowcaseCard
              card={card}
              decorative={decorative}
              key={`${card.type}-${index}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HomeShowcase({ content }: { content: SiteContent["home"] }) {
  return (
    <section className="showcase-section" aria-labelledby="showcase-title">
      <div className="showcase-heading">
        <span className="section-kicker">{content.showcaseKicker}</span>
        <h2 id="showcase-title">{content.showcaseLineOne}<br /><em>{content.showcaseAccent}</em></h2>
        <p>{content.showcaseDescription}</p>
      </div>
      <div className="showcase-lanes">
        <ShowcaseTrack cards={content.showcaseCards} />
        <ShowcaseTrack cards={content.showcaseCards} reverse />
      </div>
    </section>
  );
}
