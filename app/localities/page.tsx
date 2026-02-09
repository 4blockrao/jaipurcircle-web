// app/localities/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 600;

type LocalityRow = {
  id: string;
  slug: string;
  name: string | null;
};

export default async function LocalitiesIndexPage() {
  const { data, error } = await supabaseServer
    .from("localities")
    .select("id,slug,name")
    .order("name", { ascending: true })
    .limit(500);

  const rows = (data || []) as LocalityRow[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Jaipur Localities</h1>
      <p className="mt-3 text-neutral-300">
        Browse neighbourhood pages. Each locality includes practical context + events
        happening nearby.
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Failed to load localities: {error.message}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-neutral-300">
            No localities found yet.
          </div>
        ) : (
          rows.map((l) => {
            const label = (l.name || l.slug).toString();
            return (
              <Link
                key={l.id}
                href={`/localities/${l.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
              >
                <div className="text-lg font-medium text-white">{label}</div>
                <div className="text-sm text-neutral-400">{`/localities/${l.slug}`}</div>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-10 text-xs text-neutral-500">
        FILE-FINGERPRINT: localities-index-v1
      </div>
    </main>
  );
}
