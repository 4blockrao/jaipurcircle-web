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
      title: "Events Categories | JaipurCircle",
      description: "Browse Jaipur events by category.",
      alternates: { canonical: `${siteUrl()}/events` },
    };
  }

  const catLabel = titleize(category);
  const url = `${siteUrl()}/events/category/${encodeURIComponent(category)}`;

  return {
    title: `${catLabel} Events in Jaipur | JaipurCircle`,
    description: `Browse ${catLabel.toLowerCase()} events across Jaipur. Filter by locality to find nearby events.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${catLabel} Events in Jaipur`,
      description: `Browse ${catLabel.toLowerCase()} events across Jaipur. Filter by locality.`,
      url,
      type: "website",
    },
  };
}

export default async function EventsCategoryPage({
  params,
}: {
  params: { category?: string } | Promise<{ category?: string }>;
}) {
  const p = await resolveParams(params);
  const category = p?.category;
  if (!category) return notFound();

  const catLabel = titleize(category);

  // localities list = internal linking for SEO (works even if events table is not wired)
  const { data: localities, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .order("name", { ascending: true })
    .limit(24);

  const locs = (localities || []) as LocalityLite[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/events">Events</Link> › {catLabel}
      </nav>

      <h1 className="text-4xl font-semibold">{catLabel} Events in Jaipur</h1>
      <p className="mt-3 text-neutral-300">
        Browse {catLabel.toLowerCase()} events across Jaipur. We’ll show full listings
        once the events table is wired — for now, use locality drilldowns and the
        query hook.
      </p>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">Quick filter (query hook)</h2>
        <p className="mt-2 text-sm text-neutral-400">
          This link works even before DB wiring:
        </p>
        <Link
          className="mt-3 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          href={`/events?category=${encodeURIComponent(category)}`}
        >
          View {catLabel} in /events
        </Link>
      </section>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Failed to load localities: {error.message}
        </div>
      ) : null}

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">Browse by locality</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Locality pages help build indexable internal links.
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
                      href={`/events/locality/${encodeURIComponent(slug)}`}
                    >
                      All events in {label}
                    </Link>

                    <Link
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10"
                      href={`/events/category/${encodeURIComponent(
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

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: events-category-v1-seo-hardened
      </div>
    </main>
  );
}