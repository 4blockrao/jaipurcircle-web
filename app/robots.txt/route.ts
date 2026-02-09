export const runtime = "nodejs";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.jaipurcircle.com").replace(/\/$/, "");
}

export async function GET() {
  const baseUrl = siteUrl();

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "Disallow: /admin",
    "Disallow: /auth",
    "Disallow: /settings",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Sitemap: ${baseUrl}/sitemap-deals.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
