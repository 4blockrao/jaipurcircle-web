// app/sitemap-localities.xml/route.ts
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function xmlEscape(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const baseUrl = process.env.SITE_URL || "https://www.jaipurcircle.com";

  // Preferred: page_registry (since you already built it)
  const { data: registry, error: regErr } = await supabaseServer
    .from("page_registry")
    .select("url_path, canonical_url, updated_at, last_published_at, index_state, page_type")
    .eq("page_type", "locality")
    .eq("index_state", "index")
    .order("updated_at", { ascending: false })
    .limit(5000);

  // Fallback: localities table (in case page_registry isn’t populated yet)
  const shouldFallback = regErr || !registry || registry.length === 0;

  let urls: { loc: string; lastmod: string }[] = [];

  if (!shouldFallback) {
    urls = registry.map((r) => {
      const loc = r.canonical_url || `${baseUrl}${r.url_path}`;
      const lastmod = r.updated_at || r.last_published_at || new Date().toISOString();
      return { loc, lastmod };
    });
  } else {
    const { data: localities } = await supabaseServer
      .from("localities")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);

    urls = (localities || []).map((l) => ({
      loc: `${baseUrl}/localities/${encodeURIComponent(l.slug)}`,
      lastmod: l.updated_at || new Date().toISOString(),
    }));
  }

  const body = urls
    .map(
      (u) => `
  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${xmlEscape(new Date(u.lastmod).toISOString())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}