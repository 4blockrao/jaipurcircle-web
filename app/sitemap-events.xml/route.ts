// app/sitemap-events.xml/route.ts
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

  const { data, error } = await supabaseServer
    .from("events")
    .select("slug, updated_at, published_at, start_date, status")
    .in("status", ["published", "active", "live"])
    .order("start_date", { ascending: false })
    .limit(5000);

  // If DB query fails, still return valid XML (so route doesn't crash)
  if (error) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- sitemap error: ${xmlEscape(error.message)} -->
</urlset>`;
    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const urls = (data || []).map((e) => {
    const loc = `${baseUrl}/events/${encodeURIComponent(e.slug)}`;
    const lastmod = e.updated_at || e.published_at || new Date().toISOString();

    return `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${xmlEscape(new Date(lastmod).toISOString())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
