import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import type { Metadata } from "next";

export const runtime = "nodejs";
export const revalidate = 600;

type LocalityLite = {
  id: string;
  slug: string;
  name: string | null;
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function getLocality(slug: string) {
  const { data, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle<LocalityLite>();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug?: string };
}): Promise<Metadata> {
  const slug = params?.slug;
  if (!slug) return { title: "Deals by Locality" };

  const loc = await getLocality(slug);
  const label = (loc?.name || loc?.slug || slug).toString();
  const url = `${siteUrl()}/deals/locality/${encodeURIComponent(slug)}`;

  return {
    title: `Deals in ${label} | JaipurCircle`,
    description: `Curated deals and offers in ${label}, Jaipur. Browse by category and drill down into locality-specific pages.`,
    alternates: { canonical: url },
    openGraph: {
      title: `Deals in ${label}`,
      description: `Curated offers in ${label}, Jaipur. Browse by category.`,
      url,
      type: "website",
    },
  };
}

export default async function DealsByLocalityPage({
  params,
}: {
  params: { slug?: string };
}) {
  const slug = params?.slug;
  if (!slug) return notFound();

  const loc = await getLocality(slug);
  if (!loc) return notFound();

  const label = (loc.name || loc.slug).toString();

  const categories = [
    "restaurants",
    "cafes",
    "shopping",
    "salons",
    "gyms",
    "event-tickets",
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/deals">Deals</Link> ›{" "}
        <Link href="/localities">Localities</Link> › {label}
      </nav>

      <h1 className="text-4xl font-semibold">Deals in {label}</h1>
      <p className="mt-3 text-neutral-300">
        Curated offers for <b>{label}</b>. We’ll show listings once the deals table is wired.
        For now, use category drilldowns below.
      </p>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">Browse deals by category</h2>
        <p className="mt-2 text-sm text-neutral-400">
          These pages work now. Locality-scoped listings will be powered by DB later.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/deals/category/${encodeURIComponent(c)}/locality/${encodeURIComponent(loc.slug)}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              {c.replaceAll("-", " ")}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">What you’ll find here (v1)</h2>
        <ul className="mt-3 list-disc pl-5 text-neutral-300">
          <li>Locality landing page with clean SEO-friendly URL</li>
          <li>Category deep links for internal navigation</li>
          <li>Later: actual deal listings from DB</li>
        </ul>
      </section>

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: deals-locality-v1-seo
      </div>
    </main>
  );
}
