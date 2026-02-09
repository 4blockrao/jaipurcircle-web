import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 600;

type LocalityRow = {
  id: string;
  slug: string;
  name: string | null;
  title: string | null;
};

export default async function LocalitiesIndexPage() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("localities")
    .select("id,slug,name,title")
    .order("slug", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Jaipur Localities</h1>
      <p className="mt-3 text-neutral-300">
        Browse neighbourhood pages. Each locality includes practical context + events happening nearby.
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Failed to load localities: {error.message}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        {!data || data.length === 0 ? (
          <div className="text-neutral-400">No localities found yet.</div>
        ) : (
          <ul className="space-y-2">
            {(data as LocalityRow[]).map((l) => {
              const label = (l.name || l.title || l.slug).toString();
              return (
                <li key={l.id} className="flex items-center justify-between">
                  <Link className="underline" href={`/localities/${l.slug}`}>
                    {label}
                  </Link>
                  <Link className="text-sm text-neutral-400 underline" href={`/jaipur/${l.slug}`}>
                    /jaipur/{l.slug}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 text-xs text-neutral-500">
        FILE-FINGERPRINT: localities-index-v1
      </div>
    </main>
  );
}
