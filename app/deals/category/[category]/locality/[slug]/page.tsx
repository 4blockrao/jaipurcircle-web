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
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category?: string; slug?: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  if (!category || !slug) return { title: "Deals | JaipurCircle" };

  const catLabel = titleize(category);
  const locLabel = slug.replaceAll("-", " ");
  const url = `${siteUrl()}/deals/category/${encodeURIComponent(category)}/locality/${encodeURIComponent(
    slug
  )}`;

  return {
    title: `${catLabel} deals in ${titleize(locLabel)} | JaipurCircle`,
    description: `Browse ${catLabel.toLowerCase()} deals in ${locLabel} (Jaipur). Locality-filtered deals page for practical nearby savings.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${catLabel} deals in ${titleize(locLabel)}`,
      description: `Browse ${catLabel.toLowerCase()} deals in ${locLabel} (Jaipur).`,
      url,
      type: "website",
    },
  };
}

export default async function DealsCategoryLocalityPage({
  params,
}: {
  params: Promise<{ category?: string; slug?: string }>;
}) {
  const { category, slug } = await params;

  if (!category) return notFound();
  if (!slug) return notFound();

  const { data: loc, error: locErr } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle<LocalityLite>();

  if (locErr || !loc) return notFound();

  const locLabel = (loc.name || loc.slug).toString();
  const catLabel = titleize(category);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/deals">Deals</Link> ›{" "}
        <Link href={`/deals/category/${encodeURIComponent(category)}`}>{catLabel}</Link> ›{" "}
        <Link href={`/deals/locality/${encodeURIComponent(loc.slug)}`}>{locLabel}</Link>
      </nav>

      <h1 className="text-4xl font-semibold">
        {catLabel} deals in {locLabel}
      </h1>
      <p className="mt-3 text-neutral-300">
        This is the locality-filtered category landing page. We’ll show actual deals once the DB table is
        wired.
      </p>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">Quick links</h2>
        <ul className="mt-3 list-disc pl-5 text-neutral-300">
          <li>
            <Link className="underline" href={`/deals/category/${encodeURIComponent(category)}`}>
              View all {catLabel} deals
            </Link>
          </li>
          <li>
            <Link className="underline" href={`/deals/locality/${encodeURIComponent(loc.slug)}`}>
              View all deals in {locLabel}
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: deals-category-locality-v1
      </div>
    </main>
  );
}