// app/localities/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 600;

type LocalityLite = {
  id: string;
  name?: string | null;
  title?: string | null;
  slug: string;
};

export default async function LocalitiesIndexPage() {
  const { data, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name,title")
    .order("name", { ascending: true })
    .limit(500);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Jaipur Localities</h1>
      <p className="mt-2 text-neutral-400">
        Browse neighbourhood pages. Each locality includes practical context + events happening nearby.
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Failed to load localities: {error.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.length ? (
          (data as LocalityLite[]).map((l) => {
            const label = (l.name || l.title || l.slug || "").toString();
            return (
              <Link
                key={l.id}
                href={`/jaipur/${l.slug}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="text-lg font-medium">{label}</div>
                <div className="mt-2 text-sm text-neutral-400">View locality guide →</div>
              </Link>
            );
          })
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-10 text-neutral-400">
            No localities found yet.
          </div>
        )}
      </div>

      <div className="mt-8 text-xs text-neutral-500">
        FILE-FINGERPRINT: localities-index-v1
      </div>
    </main>
  );
}
