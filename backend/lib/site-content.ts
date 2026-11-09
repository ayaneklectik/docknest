import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, isBusinessDatabaseReady } from "@backend/db";

const imagePath = z.string().max(500).refine(
  (value) => value === "" || /^\/media\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(value),
  "Choose an uploaded image."
);

const showcaseCardSchema = z.object({
  type: z.enum(["hosting", "web", "domains", "support"]),
  category: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240),
  href: z.enum(["/hosting", "/services", "/domains", "/support", "/quote", "/contact"]),
  imageUrl: imagePath
});

const offeringSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(500),
  quoteService: z.enum([
    "Website development",
    "Web application",
    "E-commerce website",
    "News and media portal",
    "Custom software and API",
    "Website maintenance"
  ])
});

const valueSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(300)
});

const copy = (max = 500) => z.string().trim().min(1).max(max);

export const siteContentSchema = z.object({
  brand: z.object({
    name: copy(80),
    tagline: copy(180),
    footerDescription: copy(300),
    email: z.string().trim().max(254),
    phone: z.string().trim().max(80),
    location: copy(120),
    logoUrl: imagePath
  }),
  navigation: z.object({
    hosting: copy(60),
    development: copy(60),
    domains: copy(60),
    about: copy(60),
    journal: copy(60),
    cta: copy(80)
  }),
  home: z.object({
    heroEyebrow: copy(100),
    heroLineOne: copy(100),
    heroLineTwo: copy(100),
    heroAccent: copy(100),
    heroDescription: copy(500),
    heroPrimaryLabel: copy(100),
    heroSecondaryLabel: copy(100),
    proof: copy(160),
    showcaseKicker: copy(100),
    showcaseLineOne: copy(100),
    showcaseAccent: copy(100),
    showcaseDescription: copy(300),
    showcaseCards: z.array(showcaseCardSchema).length(4),
    introKicker: copy(100),
    introLineOne: copy(100),
    introLineTwo: copy(100),
    introAccent: copy(100),
    introLead: copy(300),
    introDescription: copy(500),
    introLinkLabel: copy(100),
    servicesKicker: copy(100),
    servicesLineOne: copy(100),
    servicesAccent: copy(100),
    servicesDescription: copy(300),
    statementKicker: copy(100),
    statementLineOne: copy(100),
    statementAccent: copy(100),
    statementLinkLabel: copy(100),
    ctaKicker: copy(100),
    ctaLineOne: copy(100),
    ctaAccent: copy(100),
    ctaButtonLabel: copy(100)
  }),
  pages: z.object({
    about: z.object({
      eyebrow: copy(100),
      lineOne: copy(100),
      lineTwo: copy(100),
      accent: copy(100),
      description: copy(500),
      storyKicker: copy(100),
      storyTitle: copy(160),
      storyParagraphOne: copy(700),
      storyParagraphTwo: copy(700),
      values: z.array(valueSchema).min(1).max(6)
    }),
    services: z.object({
      eyebrow: copy(100),
      lineOne: copy(100),
      accent: copy(100),
      description: copy(500),
      offerings: z.array(offeringSchema).min(1).max(20),
      note: copy(500)
    }),
    hosting: z.object({
      eyebrow: copy(100),
      lineOne: copy(100),
      lineTwo: copy(100),
      accent: copy(100),
      description: copy(500),
      sectionKicker: copy(100),
      sectionTitle: copy(160),
      sectionDescription: copy(500),
      fallbackPlanPrices: z.array(z.string().trim().max(80)).length(4).default(["", "", "", ""])
    })
  }),
  footer: z.object({
    calloutKicker: copy(100),
    calloutLineOne: copy(100),
    calloutAccent: copy(100),
    calloutButton: copy(100)
  })
});

export type SiteContent = z.infer<typeof siteContentSchema>;

export const defaultSiteContent: SiteContent = {
  brand: {
    name: "Docknest",
    tagline: "A stronger home for your next idea",
    footerDescription: "Thoughtful infrastructure and digital craft for what comes next.",
    email: "",
    phone: "",
    location: "Bangladesh · Working worldwide",
    logoUrl: ""
  },
  navigation: {
    hosting: "Hosting",
    development: "Development",
    domains: "Domains",
    about: "About",
    journal: "Journal",
    cta: "Talk to our team"
  },
  home: {
    heroEyebrow: "Hosting · Digital craft · Human support",
    heroLineOne: "A stronger home",
    heroLineTwo: "for your",
    heroAccent: "next idea.",
    heroDescription: "The infrastructure to stay online. The people to help you move forward. One thoughtful partner for your digital journey.",
    heroPrimaryLabel: "Tell us what you’re building",
    heroSecondaryLabel: "Explore hosting",
    proof: "Working from Bangladesh, supporting the world",
    showcaseKicker: "A little of what we do",
    showcaseLineOne: "Good ideas deserve",
    showcaseAccent: "a great foundation.",
    showcaseDescription: "Hosting, digital craft, and human support—working together to move your business forward.",
    showcaseCards: [
      { type: "hosting", category: "Hosting", title: "A steady home for your website", description: "Hosting that leaves room for what comes next.", href: "/hosting", imageUrl: "" },
      { type: "web", category: "Development", title: "Your next idea, out in the world", description: "Websites and digital experiences, thoughtfully built.", href: "/services", imageUrl: "" },
      { type: "domains", category: "Domains", title: "A name worth building on", description: "Find the right domain for your next chapter.", href: "/domains", imageUrl: "" },
      { type: "support", category: "Support", title: "People on the other side", description: "Practical help from real humans when you need it.", href: "/support", imageUrl: "" }
    ],
    introKicker: "01 — A partner, not just a platform",
    introLineOne: "Technology should",
    introLineTwo: "make room for",
    introAccent: "ambition.",
    introLead: "Starting small or scaling up, your digital foundation should feel clear, capable, and cared for.",
    introDescription: "Docknest brings hosting, development, and ongoing support together—so you can focus on the work only you can do.",
    introLinkLabel: "Meet Docknest",
    servicesKicker: "02 — Room to grow",
    servicesLineOne: "Good foundations.",
    servicesAccent: "Better possibilities.",
    servicesDescription: "Not sure what fits? Tell us where you’re headed and we’ll help shape the right setup.",
    statementKicker: "03 — Thoughtful by design",
    statementLineOne: "Make the technical",
    statementAccent: "feel human.",
    statementLinkLabel: "Explore what we build",
    ctaKicker: "04 — Start a conversation",
    ctaLineOne: "Let’s make your",
    ctaAccent: "next move count.",
    ctaButtonLabel: "Share your project"
  },
  pages: {
    about: {
      eyebrow: "A new kind of digital partner",
      lineOne: "Make the complex",
      lineTwo: "feel",
      accent: "considered.",
      description: "Docknest is an emerging hosting and digital solutions company working from Bangladesh and supporting customers wherever their ideas take them.",
      storyKicker: "Why Docknest exists",
      storyTitle: "Good technology is a team effort.",
      storyParagraphOne: "Every online project depends on decisions made before launch and care given long after it. We bring infrastructure, digital craft, and practical support into one relationship.",
      storyParagraphTwo: "Our goal is straightforward: make strong digital foundations more approachable for individuals, small businesses, and ambitious teams.",
      values: [
        { title: "Clear by default", description: "Honest recommendations, transparent scope, and no made-up promises." },
        { title: "Built to move", description: "Practical solutions that give your next idea room to grow." },
        { title: "People included", description: "Technology should feel understandable and support should feel human." }
      ]
    },
    services: {
      eyebrow: "Design · Development · Continuity",
      lineOne: "Digital work,",
      accent: "made with intent.",
      description: "We design and build useful digital experiences, then help you keep them moving. Fixed packages can be configured by Docknest; unique projects start with a conversation.",
      offerings: [
        { title: "Business websites", description: "Clear, confident websites that help customers understand your business and take the next step.", quoteService: "Website development" },
        { title: "Portfolio and landing pages", description: "Distinctive digital homes for your work, launch, campaign, or growing personal brand.", quoteService: "Website development" },
        { title: "E-commerce websites", description: "Storefront experiences designed around your products, operations, and customer journey.", quoteService: "E-commerce website" },
        { title: "News and media portals", description: "Publishing experiences for editorial teams, readers, and growing libraries of content.", quoteService: "News and media portal" },
        { title: "React and Next.js applications", description: "Purpose-built web applications shaped to the way your product needs to work.", quoteService: "Web application" },
        { title: "Custom software and APIs", description: "Connected systems, integrations, and software for needs off-the-shelf tools cannot cover.", quoteService: "Custom software and API" },
        { title: "Website maintenance", description: "Ongoing updates and technical care, scoped as a monthly maintenance subscription.", quoteService: "Website maintenance" }
      ],
      note: "Docknest does not offer WordPress website development. Pricing is set by administrators and shared in a project quotation; this site does not publish invented package prices."
    },
    hosting: {
      eyebrow: "Hosting, with headroom",
      lineOne: "Your work deserves",
      lineTwo: "a",
      accent: "reliable home.",
      description: "From a first site to a growing online business, we’ll help you choose an environment that fits—not a one-size-fits-all plan.",
      sectionKicker: "A place to begin",
      sectionTitle: "Choose your starting point.",
      sectionDescription: "Every recommendation starts with your requirements. Final prices are configured by Docknest and shared in a quotation.",
      fallbackPlanPrices: ["", "", "", ""]
    }
  },
  footer: {
    calloutKicker: "Have something in mind?",
    calloutLineOne: "Let’s make room",
    calloutAccent: "for what’s next.",
    calloutButton: "Tell us about it"
  }
};

function assertSiteSettingsTable() {
  if (!isBusinessDatabaseReady()) {
    return false;
  }
  return Boolean(db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'site_settings'"
  ).get());
}

export function getSiteContent(): SiteContent {
  if (!assertSiteSettingsTable()) return defaultSiteContent;
  const row = db.prepare(
    "SELECT value_json FROM site_settings WHERE key = 'site_content'"
  ).get() as { value_json: string } | undefined;
  if (!row) return defaultSiteContent;

  let value: unknown;
  try {
    value = JSON.parse(row.value_json);
  } catch (error) {
    console.error("Saved site content is not valid JSON.", error);
    throw new Error("Saved site content is invalid. Restore a valid site configuration from the admin editor.");
  }
  const parsed = siteContentSchema.safeParse(value);
  if (!parsed.success) {
    console.error("Saved site content does not match the current schema.", parsed.error.flatten());
    throw new Error("Saved site content is invalid. Review the site configuration before continuing.");
  }
  return parsed.data;
}

export function saveSiteContent(content: SiteContent, actorId: string): void {
  if (!assertSiteSettingsTable()) {
    throw new Error("Site content storage is unavailable. Run npm run db:migrate.");
  }
  const save = db.transaction(() => {
    db.prepare(
      `INSERT INTO site_settings (key, value_json, updated_at)
       VALUES ('site_content', ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`
    ).run(JSON.stringify(content));
    db.prepare(
      `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, 'site.content_saved', 'site', 'site_content', ?)`
    ).run(randomUUID(), actorId, JSON.stringify({
      showcaseCards: content.home.showcaseCards.length,
      serviceOfferings: content.pages.services.offerings.length
    }));
  });
  save();
}
