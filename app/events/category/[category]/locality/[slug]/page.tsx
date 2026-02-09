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
  params:
    | { category?: string; slug?: string }
    | Promise<{ category?: string; slug?: string }>
) {
  return await Promise.resolve(params);
}

export async function generateMetadata({
  params,
}: {
  params:
    | { category?: string; slug?: string }
    | Promise<{ category?: string; slug?: string }>;
}): Promise<Metadata> {
  const p = await resolveParams(params);
  const category = p?.category;
  const slug = p?.slug;

  if (!category || !slug) {
    return {
      title: "Events | JaipurCircle",
      description: "Browse Jaipur events by category and locality.",
      alternates: { canonical: `${siteUrl()}/events` },
    };
  }

  const catLabel = titleize(category);
  const url = `${siteUrl()}/events/category/${encodeURIComponent(
    category
  )}/locality/${encodeURIComponent(slug)}`;

  // We'll try to fetch locality name for nicer title; if it fails, fall back safely.
  const { data: loc } = await supabaseServer
    .from("localities")
    .select("slug,name")
    .eq("slug", slug)
    .maybeSingle<Pick<LocalityLite, "slug" | "name">>();

  const locLabel = (loc?.name || loc?.slug || slug).toString();

  return {
    title: `${catLabel} Events in ${locLabel} | JaipurCircle`,
    description: `Browse ${catLabel.toLowerCase()} events in ${locLabel}, Jaipur. This page becomes fully populated once events are wired with locality tagging.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${catLabel} Events in ${locLabel}`,
      description: `Browse ${catLabel.toLowerCase()} events in ${locLabel}.`,
      url,
      type: "website",
    },
  };
}

export default async function EventsCategoryLocalityPage({
  params,
}: {
  params:
    | { category?: string; slug?: string }
    | Promise<{ category?: string; slug?: string }>;
}) {
  const p = await resolveParams(params);
  const category = p?.category;
  const slug = p?.slug;

  if (!category || !slug) return notFound();

  const { data: loc, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle<LocalityLite>();

  if (error || !loc) return notFound();

  const locLabel = (loc.name || loc.slug).toString();
  const catLabel = titleize(category);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/events">Events</Link> ›{" "}
        <Link href={`/events/category/${encodeURIComponent(category)}`}>{catLabel}</Link> ›{" "}
        <Link href={`/events/locality/${encodeURIComponent(loc.slug)}`}>{locLabel}</Link>
      </nav>

      <h1 className="text-4xl font-semibold">
        {catLabel} events in {locLabel}
      </h1>

      <p className="mt-3 text-neutral-300">
        Locality-filtered category landing page. We’ll show listings once events are wired
        with locality tagging. Meanwhile, these links are SEO-safe and useful.
      </p>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium">Quick links</h2>
        <ul className="mt-3 list-disc pl-5 text-neutral-300">
          <li>
            <Link className="underline" href={`/events/category/${encodeURIComponent(category)}`}>
              View all {catLabel} events
            </Link>
          </li>
          <li>
            <Link className="underline" href={`/events/locality/${encodeURIComponent(loc.slug)}`}>
              View all events in {locLabel}
            </Link>
          </li>
          <li>
            <Link
              className="underline"
              href={`/events?category=${encodeURIComponent(category)}&locality=${encodeURIComponent(loc.slug)}`}
            >
              Combined filter (query hook): /events?category={category}&locality={loc.slug}
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: events-category-locality-v1-seo-hardened
      </div>
    </main>
  );
}