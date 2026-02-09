// app/sitemap-events.xml/route.ts
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 3600;

const CATEGORIES = [
  "music",
  "festivals",
  "comedy",
  "workshops",
  "sports",
  "kids",
  "exhibitions",
  "food-drink",
  "nightlife",
] as const;

function siteUrl() {
  return (process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000").replace(/\/$/, "");
}

function xmlEscape(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlNode(loc: string, changefreq = "weekly", priority = "0.6") {
  return [
    "<url>",
    `<loc>${xmlEscape(loc)}</loc>`,
    `<changefreq>${changefreq}</changefreq>`,
    `<priority>${priority}</priority>`,
    "</url>",
  ].join("");
}

export async function GET() {
  const base = siteUrl();

  // Pull locality slugs (only columns we know exist)
  const { data } = await supabaseServer
    .from("localities")
    .select("slug")
    .order("slug", { ascending: true })
    .limit(5000);

  const localitySlugs = (data || [])
    .map((r: any) => r?.slug)
    .filter((s: any) => typeof s === "string" && s.length > 0);

  const urls: string[] = [];

  // Core events index
  urls.push(urlNode(`${base}/events`, "daily", "0.8"));

  // Category pages
  for (const cat of CATEGORIES) {
    urls.push(urlNode(`${base}/events/category/${encodeURIComponent(cat)}`, "weekly", "0.7"));
  }

  // Locality pages + category×locality pages
  for (const slug of localitySlugs) {
    urls.push(urlNode(`${base}/events/locality/${encodeURIComponent(slug)}`, "weekly", "0.7"));
    for (const cat of CATEGORIES) {
      urls.push(
        urlNode(
          `${base}/events/category/${encodeURIComponent(cat)}/locality/${encodeURIComponent(slug)}`,
          "weekly",
          "0.6"
        )
      );
    }
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.join("") +
    `</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
