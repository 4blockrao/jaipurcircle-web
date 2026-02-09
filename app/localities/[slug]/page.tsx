// app/localities/[slug]/page.tsx (Locality Page v1.1: unique + nearby links)
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 600;

type LocalityLite = {
  id: number | string;
  slug: string;
  name: string | null;
  known_for?: string | null;
  seo_blurb?: string | null;
};

function titleCase(s: string) {
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: { slug?: string } | Promise<{ slug?: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  const fallbackName = slug ? titleCase(slug) : "Locality";

  let name = fallbackName;
  let knownFor = "";
  let blurb = "";

  try {
    if (slug) {
      const { data } = await supabaseServer
        .from("localities")
        .select("slug,name,known_for,seo_blurb")
        .eq("slug", slug)
        .maybeSingle<Pick<LocalityLite, "slug" | "name" | "known_for" | "seo_blurb">>();

      if (data?.name) name = data.name;
      if (data?.known_for) knownFor = data.known_for;
      if (data?.seo_blurb) blurb = data.seo_blurb;
    }
  } catch {}

  const title = `${name}, Jaipur — Local Guide & Nearby Events | JaipurCircle`;
  const description =
    blurb ||
    (knownFor
      ? `Explore ${name} in Jaipur. Known for: ${knownFor}. See what’s nearby and events happening in/around ${name}.`
      : `Explore ${name} in Jaipur: practical neighborhood context and events happening nearby. Updated regularly by JaipurCircle.`);

  return {
    title,
    description,
    alternates: slug ? { canonical: `/localities/${slug}` } : undefined,
    openGraph: {
      title,
      description,
      url: slug ? `/localities/${slug}` : "/localities",
      type: "article",
    },
  };
}

export default async function LocalityPage({
  params,
}: {
  params: { slug?: string } | Promise<{ slug?: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  if (!slug) return notFound();

  const { data, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name,known_for,seo_blurb")
    .eq("slug", slug)
    .maybeSingle<LocalityLite>();

  if (error || !data) return notFound();

  const name = (data.name || titleCase(data.slug)).toString();

  // Nearby localities: simple “not this slug, ordered by name” (v1.1)
  const { data: nearby } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .neq("slug", data.slug)
    .order("name", { ascending: true })
    .limit(10);

  const knownFor = (data.known_for || "").trim();
  const blurb = (data.seo_blurb || "").trim();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/" className="hover:text-white">Home</Link> ›{" "}
        <Link href="/localities" className="hover:text-white">Localities</Link> ›{" "}
        <span className="text-neutral-200">{name}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{name}</h1>

        {knownFor ? (
          <p className="text-neutral-300">
            <span className="text-neutral-400">Known for:</span>{" "}
            <span className="text-neutral-200">{knownFor}</span>
          </p>
        ) : null}

        <p className="text-neutral-300">
          {blurb ||
            `${name} is one of Jaipur’s well-known neighborhoods. This is JaipurCircle’s locality hub — a quick snapshot plus events happening nearby.`}
        </p>

        <p className="text-neutral-400">
          We’ll keep enriching this with landmarks, food streets, parks, markets, commute tips, and local recommendations — so each locality page stays distinct and indexable.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium text-white">Explore</h2>
        <ul className="mt-3 space-y-2 text-neutral-300">
          <li>
            <Link className="underline underline-offset-4" href="/localities">
              Browse all localities
            </Link>
          </li>
          <li>
            <Link
              className="underline underline-offset-4"
              href={`/events?locality=${encodeURIComponent(data.slug)}`}
            >
              Events near {name}
            </Link>
          </li>
          <li>
            <Link className="underline underline-offset-4" href="/events">
              Browse all Jaipur events
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-medium text-white">Nearby localities</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Quick jumps for internal linking and exploration.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(nearby || []).map((l: any) => {
            const label = (l.name || titleCase(l.slug)).toString();
            return (
              <Link
                key={l.id}
                href={`/localities/${l.slug}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-200 hover:bg-white/10"
              >
                {label}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: locality-detail-v1-1-unique-nearby
      </div>
    </main>
  );
}
