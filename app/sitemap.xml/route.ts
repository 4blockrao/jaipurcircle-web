// app/sitemap.xml/route.ts
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
  const baseUrl = (process.env.SITE_URL || "https://www.jaipurcircle.com").replace(/\/$/, "");
  const now = new Date().toISOString();

  // Add more sitemaps here as we build them.
  const sitemaps = [
    { loc: `${baseUrl}/sitemap-events.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-localities.xml`, lastmod: now },
    // Later:
    // { loc: `${baseUrl}/sitemap-deals.xml`, lastmod: now },
    // { loc: `${baseUrl}/sitemap-news.xml`, lastmod: now },
    // { loc: `${baseUrl}/sitemap-merchants.xml`, lastmod: now },
  ];

  const body = sitemaps
    .map(
      (s) => `
  <sitemap>
    <loc>${xmlEscape(s.loc)}</loc>
    <lastmod>${xmlEscape(s.lastmod)}</lastmod>
  </sitemap>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
