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

function titleize(s: string) {
  return s
    .replaceAll("-", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function resolveParams(
  params: { category?: string } | Promise<{ category?: string }>
) {
  return await Promise.resolve(params);
}

export async function generateMetadata({
  params,
}: {
  params: { category?: string } | Promise<{ category?: string }>;
}): Promise<Metadata> {
  const p = await resolveParams(params);
  const category = p?.category;

  if (!category) {
    return {
      title: "Deals Category | JaipurCircle",
      description: "Browse deals by category across Jaipur.",
      alternates: { canonical: `${siteUrl()}/deals` },
    };
  }

  const catLabel = titleize(category);
  const url = `${siteUrl()}/deals/category/${encodeURIComponent(category)}`;

  return {
    title: `${catLabel} Deals & Offers in Jaipur | JaipurCircle`,
    description: `Discover ${catLabel.toLowerCase()} deals and offers in Jaipur. Filter by locality for practical nearby savings.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${catLabel} Deals in Jaipur`,
      description: `Browse ${catLabel.toLowerCase()} deals across Jaipur. Filter by locality.`,
      url,
      type: "website",
    },
  };
}

export default async function DealsCategoryPage({
  params,
}: {
  params: { category?: string } | Promise<{ category?: string }>;
}) {
  const p = await resolveParams(params);
  const category = p?.category;
  if (!category) return notFound();

  const catLabel = titleize(category);

  const { data: localities, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .order("name", { ascending: true })
    .limit(24);

  const locs = (localities || []) as LocalityLite[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/deals">Deals</Link> › {catLabel}
      </nav>

      <h1 className="text-4xl font-semibold">{catLabel} Deals in Jaipur</h1>
      <p className="mt-3 text-neutral-300">
        Browse {catLabel.toLowerCase()} deals and offers across Jaipur. We’ll show full
        listings once the deals table is wired — for now, use locality drilldowns
        (SEO-friendly internal links).
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Failed to load localities: {error.message}
        </div>
      ) : null}

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">Browse by locality</h2>
        <p className="mt-2 text-sm text-neutral-400">
          These links help users (and Google) reach locality-specific deal pages.
        </p>

        {locs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-300">
            No localities found yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {locs.map((l) => {
              const label = (l.name || l.slug).toString();
              const slug = l.slug;

              return (
                <div
                  key={l.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="font-medium text-white">{label}</div>

                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <Link
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10"
                      href={`/deals/locality/${encodeURIComponent(slug)}`}
                    >
                      All deals in {label}
                    </Link>

                    <Link
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10"
                      href={`/deals/category/${encodeURIComponent(
                        category
                      )}/locality/${encodeURIComponent(slug)}`}
                    >
                      {catLabel} in {label}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">What you’ll find here (v1)</h2>
        <ul className="mt-3 list-disc pl-5 text-neutral-300">
          <li>Category landing page with clean, indexable URL</li>
          <li>Locality drilldowns for internal linking</li>
          <li>Later: real listings from DB (deals table)</li>
        </ul>
      </section>

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: deals-category-v1-seo-hardened
      </div>
    </main>
  );
}