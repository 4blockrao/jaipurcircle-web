import type { NextConfig } from "next";

const ORIGIN = "https://www.jaipurcircle.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy Lovable static assets from the origin site
      { source: "/assets/:path*", destination: `${ORIGIN}/assets/:path*` },

      // Proxy service worker registration script if present in upstream HTML
      { source: "/registerSW.js", destination: `${ORIGIN}/registerSW.js` },

      // (Optional, harmless) proxy other common static references
      { source: "/favicon.ico", destination: `${ORIGIN}/favicon.ico` },
      { source: "/robots.txt", destination: `${ORIGIN}/robots.txt` },
      { source: "/sitemap.xml", destination: `${ORIGIN}/sitemap.xml` },
    ];
  },
};

export default nextConfig;