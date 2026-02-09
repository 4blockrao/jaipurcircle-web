import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 600;

type DealRow = {
  id: string | number;
  slug: string;
  title?: string | null;
  name?: string | null;
  category?: string | null;
};

export async function generateMetadata() {
  const title = "Jaipur Deals & Offers | JaipurCircle";
  const description =
    "Browse the latest deals and offers across Jaipur — sorted by category and locality. Curated, practical, and updated regularly.";

  return {
    title,
    description,
    alternates: { canonical: "/deals" },
    openGraph: {
      title,
      description,
      url: "/deals",
      type: "website",
    },
  };
}

export default async function DealsIndexPage() {
  const categories = [
    { key: "restaurants", label: "Restaurants" },
    { key: "cafes", label: "Cafes" },
    { key: "shopping", label: "Shopping" },
    { key: "salons", label: "Salons" },
    { key: "gyms", label: "Gyms" },
    { key: "events", label: "Event tickets" },
  ];

  let rows: DealRow[] = [];
  let errorMsg: string | null = null;

  try {
    const { data, error } = await supabaseServer
      .from("deals")
      // Keep conservative: only select columns we can reasonably expect
      .select("id,slug,title,category")
      .order("id", { ascending: false })
      .limit(200);

    if (error) errorMsg = error.message;
    rows = ((data as any) || []) as DealRow[];
  } catch (e: any) {
    errorMsg = e?.message || "Failed to load deals.";
  }

  const hasRows = rows && rows.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <span>Deals</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-4xl font-semibold text-white">Jaipur Deals & Offers</h1>
        <p className="text-neutral-300">
          Curated offers across Jaipur — browse by category, then drill down by locality.
          We keep this practical: what’s the deal, where it applies, and what to do next.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Browse by category</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.key}
              href={`/deals/category/${encodeURIComponent(c.key)}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-medium text-white">Latest deals</h2>
          <div className="text-xs text-neutral-500">SSR • revalidate {revalidate}s</div>
        </div>

        {errorMsg ? (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
            Deals table not ready (or schema mismatch):{" "}
            <span className="font-mono">{errorMsg}</span>
            <div className="mt-2 text-xs text-amber-100/80">
              This is OK for v1 — category pages will still work. We’ll wire the DB later.
            </div>
          </div>
        ) : null}

        {!hasRows ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-neutral-300">
            <div className="text-white font-medium">No deals listed yet.</div>
            <p className="mt-2 text-sm text-neutral-300">
              Start with category pages above. Once we connect the deals database table,
              deals will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {rows.map((d) => {
              const title = (d.title || d.name || d.slug).toString();
              const category = d.category ? d.category.toString() : null;

              return (
                <Link
                  key={String(d.id) + ":" + d.slug}
                  href={`/deals/${encodeURIComponent(d.slug)}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-medium text-white">{title}</div>
                    {category ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
                        {category}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-neutral-400">{`/deals/${d.slug}`}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Jaipur Deals & Offers",
            url: "/deals",
            isPartOf: { "@type": "WebSite", name: "JaipurCircle" },
          }),
        }}
      />

      <div className="mt-10 text-xs text-neutral-500">FILE-FINGERPRINT: deals-index-v1</div>
    </main>
  );
}
