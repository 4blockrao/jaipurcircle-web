// app/localities/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 600;

type LocalityRow = {
  id: string;
  slug: string;
  name?: string | null;   // optional if present in DB
  title?: string | null;  // optional if present in DB
};

export default async function LocalityPage({
  params,
}: {
  params: { slug?: string };
}) {
  const slug = params?.slug;
  if (!slug) return notFound();

  // ✅ safest select: only guaranteed columns
  const { data, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name,title")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return notFound();

  const row = data as LocalityRow;
  const label = (row.name || row.title || row.slug || slug).toString();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/">Home</Link> › <Link href="/localities">Localities</Link> › {label}
      </nav>

      <h1 className="text-3xl font-semibold">{label}</h1>
      <p className="mt-3 text-neutral-300">
        JaipurCircle locality guide for <b>{label}</b>. We’ll expand this page with practical context,
        nearby landmarks, and curated events.
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
            <Link className="underline" href={`/events?locality=${encodeURIComponent(row.slug)}`}>
              Events near {label}
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-8 text-xs text-neutral-500">
        FILE-FINGERPRINT: locality-detail-v1
      </div>
    </main>
  );
}