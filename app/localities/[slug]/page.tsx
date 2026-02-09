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
      title: "Localities | JaipurCircle",
      description: "Browse Jaipur neighbourhood pages.",
      alternates: { canonical: `${siteUrl()}/localities` },
    };
  }

  const url = `${siteUrl()}/localities/${encodeURIComponent(slug)}`;

  const { data: loc } = await supabaseServer
    .from("localities")
    .select("slug,name")
    .eq("slug", slug)
    .maybeSingle<Pick<LocalityLite, "slug" | "name">>();

  const label = (loc?.name || loc?.slug || slug).toString();

  return {
    title: `${label} | Jaipur Locality Guide | JaipurCircle`,
    description: `${label} is one of Jaipur’s neighbourhoods. JaipurCircle’s locality hub: practical snapshot + events and deals nearby.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${label} | JaipurCircle`,
      description: `Locality hub for ${label}: practical context + nearby activity.`,
      url,
      type: "website",
    },
  };
}

export default async function LocalityPage({
  params,
}: {
  params: { slug?: string } | Promise<{ slug?: string }>;
}) {
  const p = await resolveParams(params);
  const slug = p?.slug;
  if (!slug) return notFound();

  const { data, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle<LocalityLite>();

  if (error || !data) return notFound();

  const label = (data.name || data.slug).toString();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/localities">Localities</Link> › {label}
      </nav>

      <h1 className="text-3xl font-semibold">{label}</h1>
      <p className="mt-3 text-neutral-300">
        <b>{label}</b> is one of Jaipur’s well-known neighborhoods. This page is JaipurCircle’s locality
        hub for {label} — a quick, practical snapshot plus events and deals happening nearby.
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
              href={`/events?locality=${encodeURIComponent(data.slug)}`}
            >
              Events near {label}
            </Link>
          </li>
          <li>
            <Link className="underline" href="/deals">
              Browse all Jaipur deals
            </Link>
          </li>
          <li>
            <Link
              className="underline"
              href={`/deals/locality/${encodeURIComponent(data.slug)}`}
            >
              Deals in {label}
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-8 text-xs text-neutral-500">
        FILE-FINGERPRINT: locality-detail-v1-seo-hardened
      </div>
    </main>
  );
}