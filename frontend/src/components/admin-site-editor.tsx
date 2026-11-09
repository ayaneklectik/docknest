"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import type { SiteContent } from "@backend/site-content";

type Props = { initialContent: SiteContent };
type ShowcaseCard = SiteContent["home"]["showcaseCards"][number];
type Offering = SiteContent["pages"]["services"]["offerings"][number];
type AboutValue = SiteContent["pages"]["about"]["values"][number];

function TextField({
  label,
  value,
  onChange,
  multiline = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="site-field">
      {label}
      {multiline
        ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
        : <input value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function SiteImageField({
  label,
  value,
  alt,
  onChange,
  onNotice
}: {
  label: string;
  value: string;
  alt: string;
  onChange: (value: string) => void;
  onNotice: (notice: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onNotice("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        onNotice(result.error ?? "Image could not be uploaded.");
        return;
      }
      onChange(result.url);
      onNotice("Image uploaded. Save site changes to publish it.");
    } catch {
      onNotice("The server could not be reached. Please try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="site-image-field">
      <label className="site-field">
        {label}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void upload(event)} disabled={uploading} />
        <small>PNG, JPEG, or WebP · maximum 8 MB</small>
      </label>
      {value && (
        <div className="site-image-preview">
          <Image src={value} alt={alt} width={220} height={120} unoptimized />
          <button className="text-button" type="button" onClick={() => onChange("")}>Remove image</button>
        </div>
      )}
      {uploading && <span className="site-uploading">Uploading image…</span>}
    </div>
  );
}

function EditorSection({ title, description, location, href, children }: {
  title: string;
  description: string;
  location: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <details className="site-editor-section" open>
      <summary>
        <span>{title}</span>
        <small>{description}</small>
        <small className="site-editor-location">
          Public location: {href
            ? <a href={href} target="_blank" rel="noreferrer">{location} ↗</a>
            : location}
        </small>
      </summary>
      <div className="site-editor-fields">{children}</div>
    </details>
  );
}

export function AdminSiteEditor({ initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function updateBrand(key: keyof SiteContent["brand"], value: string) {
    setContent((current) => ({ ...current, brand: { ...current.brand, [key]: value } }));
  }

  function updateNavigation(key: keyof SiteContent["navigation"], value: string) {
    setContent((current) => ({ ...current, navigation: { ...current.navigation, [key]: value } }));
  }

  function updateHome(key: Exclude<keyof SiteContent["home"], "showcaseCards">, value: string) {
    setContent((current) => ({ ...current, home: { ...current.home, [key]: value } }));
  }

  function updateAbout(key: Exclude<keyof SiteContent["pages"]["about"], "values">, value: string) {
    setContent((current) => ({
      ...current,
      pages: { ...current.pages, about: { ...current.pages.about, [key]: value } }
    }));
  }

  function updateServices(key: Exclude<keyof SiteContent["pages"]["services"], "offerings">, value: string) {
    setContent((current) => ({
      ...current,
      pages: { ...current.pages, services: { ...current.pages.services, [key]: value } }
    }));
  }

  function updateHosting(key: Exclude<keyof SiteContent["pages"]["hosting"], "fallbackPlanPrices">, value: string) {
    setContent((current) => ({
      ...current,
      pages: { ...current.pages, hosting: { ...current.pages.hosting, [key]: value } }
    }));
  }

  function updateHostingPlanPrice(index: number, value: string) {
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        hosting: {
          ...current.pages.hosting,
          fallbackPlanPrices: current.pages.hosting.fallbackPlanPrices.map((price, priceIndex) =>
            priceIndex === index ? value : price
          )
        }
      }
    }));
  }

  function updateFooter(key: keyof SiteContent["footer"], value: string) {
    setContent((current) => ({ ...current, footer: { ...current.footer, [key]: value } }));
  }

  function updateShowcase<K extends keyof ShowcaseCard>(index: number, key: K, value: ShowcaseCard[K]) {
    setContent((current) => ({
      ...current,
      home: {
        ...current.home,
        showcaseCards: current.home.showcaseCards.map((card, cardIndex) =>
          cardIndex === index ? { ...card, [key]: value } : card
        )
      }
    }));
  }

  function updateOffering<K extends keyof Offering>(index: number, key: K, value: Offering[K]) {
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        services: {
          ...current.pages.services,
          offerings: current.pages.services.offerings.map((item, itemIndex) =>
            itemIndex === index ? { ...item, [key]: value } : item
          )
        }
      }
    }));
  }

  function updateValue<K extends keyof AboutValue>(index: number, key: K, value: AboutValue[K]) {
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        about: {
          ...current.pages.about,
          values: current.pages.about.values.map((item, itemIndex) =>
            itemIndex === index ? { ...item, [key]: value } : item
          )
        }
      }
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Site changes could not be saved.");
        return;
      }
      setNotice("Site changes saved and published.");
    } catch {
      setNotice("The server could not be reached. Your changes are still on this page.");
    } finally {
      setBusy(false);
    }
  }

  function addOffering() {
    const next: Offering = {
      title: "New service",
      description: "Describe this service and who it helps.",
      quoteService: "Website development"
    };
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        services: { ...current.pages.services, offerings: [...current.pages.services.offerings, next] }
      }
    }));
  }

  function removeOffering(index: number) {
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        services: {
          ...current.pages.services,
          offerings: current.pages.services.offerings.filter((_, itemIndex) => itemIndex !== index)
        }
      }
    }));
  }

  function addValue() {
    const next: AboutValue = { title: "A value to add", description: "Describe what this value means to your customers." };
    setContent((current) => ({
      ...current,
      pages: { ...current.pages, about: { ...current.pages.about, values: [...current.pages.about.values, next] } }
    }));
  }

  function removeValue(index: number) {
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        about: {
          ...current.pages.about,
          values: current.pages.about.values.filter((_, itemIndex) => itemIndex !== index)
        }
      }
    }));
  }

  return (
    <form className="site-editor" onSubmit={(event) => void save(event)}>
      <div className="site-editor-toolbar">
        <div><strong>Website content</strong><span>Changes publish to the public site after saving.</span></div>
        <button className="button button-light" type="submit" disabled={busy}>{busy ? "Saving…" : "Save and publish"}</button>
      </div>
      <p className="site-editor-notice" aria-live="polite" role="status">{notice}</p>

      <EditorSection title="Brand and contact" description="Your identity, public contact details, and logo." location="Header and footer across the whole site.">
        <div className="site-editor-grid">
          <TextField label="Business name" value={content.brand.name} onChange={(value) => updateBrand("name", value)} />
          <TextField label="Tagline" value={content.brand.tagline} onChange={(value) => updateBrand("tagline", value)} />
          <TextField label="Public email" value={content.brand.email} onChange={(value) => updateBrand("email", value)} />
          <TextField label="Public phone" value={content.brand.phone} onChange={(value) => updateBrand("phone", value)} />
          <TextField label="Location / service area" value={content.brand.location} onChange={(value) => updateBrand("location", value)} />
          <TextField label="Footer description" value={content.brand.footerDescription} onChange={(value) => updateBrand("footerDescription", value)} multiline />
        </div>
        <SiteImageField label="Logo image" value={content.brand.logoUrl} alt={`${content.brand.name} logo`} onChange={(value) => updateBrand("logoUrl", value)} onNotice={setNotice} />
      </EditorSection>

      <EditorSection title="Navigation" description="Edit the public header labels and primary action." location="Header navigation across the whole site.">
        <div className="site-editor-grid">
          {(Object.keys(content.navigation) as Array<keyof SiteContent["navigation"]>).map((key) => (
            <TextField key={key} label={key === "cta" ? "Header button" : `${key[0].toUpperCase()}${key.slice(1)} link`} value={content.navigation[key]} onChange={(value) => updateNavigation(key, value)} />
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Homepage" description="Control the hero, intro, service highlights, and calls to action." location="Homepage" href="/">
        <div className="site-editor-grid">
          {([
            ["heroEyebrow", "Hero eyebrow"], ["heroLineOne", "Hero heading · line 1"],
            ["heroLineTwo", "Hero heading · line 2"], ["heroAccent", "Hero heading · accent"],
            ["heroDescription", "Hero description"], ["heroPrimaryLabel", "Primary button"],
            ["heroSecondaryLabel", "Secondary button"], ["proof", "Hero supporting note"],
            ["showcaseKicker", "Showcase eyebrow"], ["showcaseLineOne", "Showcase heading · line 1"],
            ["showcaseAccent", "Showcase heading · accent"], ["showcaseDescription", "Showcase description"],
            ["introKicker", "Intro eyebrow"], ["introLineOne", "Intro heading · line 1"],
            ["introLineTwo", "Intro heading · line 2"], ["introAccent", "Intro heading · accent"],
            ["introLead", "Intro lead"], ["introDescription", "Intro description"],
            ["introLinkLabel", "Intro link"], ["servicesKicker", "Services eyebrow"],
            ["servicesLineOne", "Services heading"], ["servicesAccent", "Services heading · accent"],
            ["servicesDescription", "Services description"], ["statementKicker", "Statement eyebrow"],
            ["statementLineOne", "Statement heading"], ["statementAccent", "Statement heading · accent"],
            ["statementLinkLabel", "Statement link"], ["ctaKicker", "Final CTA eyebrow"],
            ["ctaLineOne", "Final CTA heading"], ["ctaAccent", "Final CTA heading · accent"],
            ["ctaButtonLabel", "Final CTA button"]
          ] as const).map(([key, label]) => (
            <TextField key={key} label={label} value={content.home[key]} onChange={(value) => updateHome(key, value)} multiline={["heroDescription", "showcaseDescription", "introLead", "introDescription", "servicesDescription"].includes(key)} />
          ))}
        </div>
        <div className="site-editor-subheading"><h3>Scrolling showcase cards</h3><p>Each image is optional; the illustrated artwork stays in place until you upload a replacement.</p></div>
        <div className="site-editor-repeater">
          {content.home.showcaseCards.map((card, index) => (
            <article className="site-editor-item" key={card.type}>
              <h4>{card.category}</h4>
              <p className="site-editor-location">Shown in the homepage scrolling showcase. The card links to <a href={card.href} target="_blank" rel="noreferrer">{card.href} ↗</a>.</p>
              <div className="site-editor-grid">
                <TextField label="Card label" value={card.category} onChange={(value) => updateShowcase(index, "category", value)} />
                <TextField label="Card title" value={card.title} onChange={(value) => updateShowcase(index, "title", value)} />
                <TextField label="Card description" value={card.description} onChange={(value) => updateShowcase(index, "description", value)} multiline />
                <label className="site-field">Card links to
                  <select value={card.href} onChange={(event) => updateShowcase(index, "href", event.target.value as ShowcaseCard["href"])}>
                    <option value="/hosting">Hosting</option><option value="/services">Development</option>
                    <option value="/domains">Domains</option><option value="/support">Support</option>
                    <option value="/quote">Quote request</option><option value="/contact">Contact</option>
                  </select>
                </label>
              </div>
              <SiteImageField label="Card image" value={card.imageUrl} alt={card.title} onChange={(value) => updateShowcase(index, "imageUrl", value)} onNotice={setNotice} />
            </article>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="About page" description="Edit the company story and values shown to visitors." location="About page" href="/about">
        <div className="site-editor-grid">
          {([
            ["eyebrow", "Eyebrow"], ["lineOne", "Heading · line 1"], ["lineTwo", "Heading · line 2"],
            ["accent", "Heading · accent"], ["description", "Page introduction"],
            ["storyKicker", "Story eyebrow"], ["storyTitle", "Story heading"],
            ["storyParagraphOne", "Story paragraph 1"], ["storyParagraphTwo", "Story paragraph 2"]
          ] as const).map(([key, label]) => (
            <TextField key={key} label={label} value={content.pages.about[key]} onChange={(value) => updateAbout(key, value)} multiline={key.startsWith("storyParagraph") || key === "description"} />
          ))}
        </div>
        <div className="site-editor-subheading"><div><h3>Company values</h3><p>These are shown on the public About page.</p></div><button className="text-button" type="button" onClick={addValue} disabled={content.pages.about.values.length >= 6}>Add value</button></div>
        <div className="site-editor-repeater">
          {content.pages.about.values.map((value, index) => (
            <article className="site-editor-item" key={`value-${index}`}>
              <div className="site-editor-item-heading"><h4>Value {index + 1}</h4><button className="text-button danger-action" type="button" onClick={() => removeValue(index)} disabled={content.pages.about.values.length <= 1}>Remove</button></div>
              <div className="site-editor-grid">
                <TextField label="Title" value={value.title} onChange={(next) => updateValue(index, "title", next)} />
                <TextField label="Description" value={value.description} onChange={(next) => updateValue(index, "description", next)} multiline />
              </div>
            </article>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Development services page" description="Manage the page heading and the service list shown to customers." location="Development services page" href="/services">
        <div className="site-editor-grid">
          {([
            ["eyebrow", "Eyebrow"], ["lineOne", "Heading"], ["accent", "Heading · accent"],
            ["description", "Page introduction"], ["note", "Pricing / service note"]
          ] as const).map(([key, label]) => (
            <TextField key={key} label={label} value={content.pages.services[key]} onChange={(value) => updateServices(key, value)} multiline={key === "description" || key === "note"} />
          ))}
        </div>
        <div className="site-editor-subheading"><div><h3>Services</h3><p>Each service links to the matching quote request category.</p></div><button className="text-button" type="button" onClick={addOffering} disabled={content.pages.services.offerings.length >= 20}>Add service</button></div>
        <div className="site-editor-repeater">
          {content.pages.services.offerings.map((offering, index) => (
            <article className="site-editor-item" key={`offering-${index}`}>
              <div className="site-editor-item-heading"><h4>Service {index + 1}</h4><button className="text-button danger-action" type="button" onClick={() => removeOffering(index)} disabled={content.pages.services.offerings.length <= 1}>Remove</button></div>
              <div className="site-editor-grid">
                <TextField label="Service name" value={offering.title} onChange={(value) => updateOffering(index, "title", value)} />
                <label className="site-field">Quote request category
                  <select value={offering.quoteService} onChange={(event) => updateOffering(index, "quoteService", event.target.value as Offering["quoteService"])}>
                    <option>Website development</option><option>Web application</option><option>E-commerce website</option>
                    <option>News and media portal</option><option>Custom software and API</option><option>Website maintenance</option>
                  </select>
                </label>
                <TextField label="Description" value={offering.description} onChange={(value) => updateOffering(index, "description", value)} multiline />
              </div>
            </article>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Hosting page" description="Edit hosting page copy; configured products and quote pricing remain in Products & pricing." location="Hosting page" href="/hosting">
        <div className="site-editor-grid">
          {([
            ["eyebrow", "Eyebrow"], ["lineOne", "Heading · line 1"], ["lineTwo", "Heading · line 2"],
            ["accent", "Heading · accent"], ["description", "Page introduction"],
            ["sectionKicker", "Plans section eyebrow"], ["sectionTitle", "Plans section heading"],
            ["sectionDescription", "Plans section description"]
          ] as const).map(([key, label]) => (
            <TextField key={key} label={label} value={content.pages.hosting[key]} onChange={(value) => updateHosting(key, value)} multiline={key === "description" || key === "sectionDescription"} />
          ))}
        </div>
        <div className="site-editor-subheading">
          <div><h3>Starting prices for the sample hosting cards</h3><p>Enter a simple display price, such as “৳500 / month”. Leave it blank to keep showing “Custom quote”.</p></div>
        </div>
        <div className="site-editor-grid">
          {(["Shared hosting", "Business hosting", "Managed VPS", "E-commerce hosting"] as const).map((name, index) => (
            <label className="site-field" key={name}>
              {name} · starting price
              <input
                type="text"
                maxLength={80}
                placeholder="e.g. ৳500 / month"
                value={content.pages.hosting.fallbackPlanPrices[index] ?? ""}
                onChange={(event) => updateHostingPlanPrice(index, event.target.value)}
              />
            </label>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Footer" description="Edit the closing call-to-action shown above footer links." location="Footer across the whole site.">
        <div className="site-editor-grid">
          {([
            ["calloutKicker", "Eyebrow"], ["calloutLineOne", "Heading"], ["calloutAccent", "Heading · accent"],
            ["calloutButton", "Button label"]
          ] as const).map(([key, label]) => (
            <TextField key={key} label={label} value={content.footer[key]} onChange={(value) => updateFooter(key, value)} />
          ))}
        </div>
      </EditorSection>

      <div className="site-editor-toolbar site-editor-bottom">
        <span>Remember to save after uploading or editing content.</span>
        <button className="button button-light" type="submit" disabled={busy}>{busy ? "Saving…" : "Save and publish"}</button>
      </div>
    </form>
  );
}
