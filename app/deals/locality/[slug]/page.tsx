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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return { title: "Deals by Locality | JaipurCircle" };

  const url = `${siteUrl()}/deals/locality/${encodeURIComponent(slug)}`;

  return {
    title: `Deals in ${slug.replaceAll("-", " ")} | JaipurCircle`,
    description: `Browse deals and offers in ${slug.replaceAll("-", " ")} (Jaipur). Filter by category and discover savings nearby.`,
    alternates: { canonical: url },
    openGraph: {
      title: `Deals in ${slug.replaceAll("-", " ")}`,
      description: `Browse deals and offers in ${slug.replaceAll("-", " ")} (Jaipur).`,
      url,
      type: "website",
    },
  };
}

export default async function DealsByLocalityPage({
  params,
}: {
  params: Promise<{ slug?: string }>;
}) {
  const { slug } = await params;
  if (!slug) return notFound();

  const { data: loc, error: locErr } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle<LocalityLite>();

  if (locErr || !loc) return notFound();

  const label = (loc.name || loc.slug).toString();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/deals">Deals</Link> ›{" "}
        <Link href="/localities">Localities</Link> › {label}
      </nav>

      <h1 className="text-4xl font-semibold">Deals in {label}</h1>
      <p className="mt-3 text-neutral-300">
        Curated offers for <b>{label}</b>. We’ll show listings once the deals table is wired.
      </p>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">Browse deals by category</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Category pages work now. Locality-scoped listings will be powered by DB later.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["restaurants", "cafes", "shopping", "salons", "gyms", "event-tickets"].map((c) => (
            <Link
              key={c}
              href={`/deals/category/${c}/locality/${encodeURIComponent(loc.slug)}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              {c.replaceAll("-", " ")}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: deals-locality-v1
      </div>
    </main>
  );
}