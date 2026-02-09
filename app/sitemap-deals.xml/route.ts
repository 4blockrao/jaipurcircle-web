export const runtime = "nodejs";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.jaipurcircle.com").replace(/\/$/, "");
}

function xmlEscape(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const base = siteUrl();

  // v1: hard-coded deal categories (we can switch to DB later)
  const categories = ["restaurants", "cafes", "shopping", "salons", "gyms", "event-tickets"];

  // v1: try to pull localities from DB; if it fails, still return category URLs
  let localitySlugs: string[] = [];
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data } = await supabase.from("localities").select("slug").limit(2000);
      localitySlugs = (data || []).map((r: any) => r.slug).filter(Boolean);
    }
  } catch {
    // ignore: sitemap still valid without locality URLs
  }

  const urls: { loc: string; changefreq?: string; priority?: string }[] = [];

  // Core deals URLs
  urls.push({ loc: `${base}/deals`, changefreq: "daily", priority: "0.8" });

  // Category pages
  for (const c of categories) {
    urls.push({ loc: `${base}/deals/category/${encodeURIComponent(c)}`, changefreq: "weekly", priority: "0.7" });
  }

  // Locality pages (optional)
  for (const slug of localitySlugs) {
    urls.push({ loc: `${base}/deals/locality/${encodeURIComponent(slug)}`, changefreq: "weekly", priority: "0.6" });
  }

  // Category + locality pages (optional)
  for (const c of categories) {
    for (const slug of localitySlugs) {
      urls.push({
        loc: `${base}/deals/category/${encodeURIComponent(c)}/locality/${encodeURIComponent(slug)}`,
        changefreq: "weekly",
        priority: "0.5",
      });
    }
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${xmlEscape(u.loc)}</loc>\n` +
          (u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : "") +
          (u.priority ? `    <priority>${u.priority}</priority>\n` : "") +
          `  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
