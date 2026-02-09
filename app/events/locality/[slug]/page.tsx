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
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function resolveParams(
  params: { slug?: string } | Promise<{ slug?: string }>
) {
  return await Promise.resolve(params);
}

export async function generateMetadata({
  params,
}: {
  params: { slug?: string } | Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const p = await resolveParams(params);
  const slug = p?.slug;

  if (!slug) {
    return {
      title: "Events by Locality | JaipurCircle",
      description: "Browse Jaipur events by locality.",
      alternates: { canonical: `${siteUrl()}/events` },
    };
  }

  const url = `${siteUrl()}/events/locality/${encodeURIComponent(slug)}`;

  const { data: loc } = await supabaseServer
    .from("localities")
    .select("slug,name")
    .eq("slug", slug)
    .maybeSingle<Pick<LocalityLite, "slug" | "name">>();

  const label = (loc?.name || loc?.slug || slug).toString();

  return {
    title: `Events in ${label} | JaipurCircle`,
    description: `Browse events in ${label}, Jaipur. This page becomes fully populated once events are wired with locality tagging.`,
    alternates: { canonical: url },
    openGraph: {
      title: `Events in ${label}`,
      description: `Browse events in ${label}, Jaipur.`,
      url,
      type: "website",
    },
  };
}

export default async function EventsByLocalityPage({
  params,
}: {
  params: { slug?: string } | Promise<{ slug?: string }>;
}) {
  const p = await resolveParams(params);
  const slug = p?.slug;
  if (!slug) return notFound();

  const { data: loc, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle<LocalityLite>();

  if (error || !loc) return notFound();

  const label = (loc.name || loc.slug).toString();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/events">Events</Link> ›{" "}
        <Link href="/localities">Localities</Link> › {label}
      </nav>

      <h1 className="text-4xl font-semibold">Events in {label}</h1>
      <p className="mt-3 text-neutral-300">
        This is the locality landing page for events in <b>{label}</b>. We’ll show listings once the
        events table is fully wired with locality tagging.
      </p>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-medium">Explore</h2>
        <ul className="mt-3 list-disc pl-5 text-neutral-300">
          <li>
            <Link className="underline" href="/events">
              Browse all Jaipur events
            </Link>
          </li>
          <li>
            <Link
              className="underline"
              href={`/events?locality=${encodeURIComponent(loc.slug)}`}
            >
              Events filter (query hook): /events?locality={loc.slug}
            </Link>
          </li>
          <li>
            <Link className="underline" href={`/localities/${encodeURIComponent(loc.slug)}`}>
              View locality page
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-8 text-xs text-neutral-500">
        FILE-FINGERPRINT: events-locality-v1-seo-hardened
      </div>
    </main>
  );
}