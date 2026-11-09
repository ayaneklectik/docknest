import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = ["/", "/hosting", "/services", "/domains", "/about", "/contact", "/quote", "/support", "/blog", "/knowledge-base", "/privacy", "/terms", "/refund-policy", "/sla"];
  return routes.map((route) => ({
    url: new URL(route, baseUrl).toString(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.6
  }));
}
