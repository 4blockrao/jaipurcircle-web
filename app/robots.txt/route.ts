// app/robots.txt/route.ts
export const runtime = "nodejs";

export async function GET() {
  const baseUrl = process.env.SITE_URL || "https://www.jaipurcircle.com";

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    // Keep these blocked if they exist in your app:
    "Disallow: /admin",
    "Disallow: /auth",
    "Disallow: /settings",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
