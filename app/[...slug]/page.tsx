// app/[...slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 600;

type PageRegistryRow = {
  page_type: string;
  entity_table: string | null;
  entity_id: string | null;
  entity_key: string | null;
  url_path: string;
};

export default async function CatchAllPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const path = "/" + (params.slug || []).join("/");

  // 1️⃣ Look up path in page_registry
  const { data: reg, error } = await supabaseServer
    .from("page_registry")
    .select(
      "page_type, entity_table, entity_id, entity_key, url_path"
    )
    .eq("url_path", path)
    .maybeSingle<PageRegistryRow>();

  if (error || !reg) {
    notFound();
  }

  // 2️⃣ Route by page_type
  switch (reg.page_type) {
    case "event":
      return renderEvent(path);

    case "locality":
      return renderLocality(path);

    default:
      notFound();
  }
}

/* ======================================================
   EVENT RENDERER (delegates to /events/[slug])
====================================================== */
async function renderEvent(path: string) {
  const slug = path.replace("/events/", "");

  const { data: event } = await supabaseServer
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!event) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/events">Events</Link> › {event.title}
      </nav>

      <h1 className="text-3xl font-semibold">
        {event.title} — {event.city || "Jaipur"}
      </h1>

      <p className="mt-3 text-neutral-300">
        {event.short_description || event.description}
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>Date: {event.start_date || "TBA"}</div>
        <div>Venue: {event.venue_name || "To be announced"}</div>
        <div>
          Ticket:{" "}
          {event.is_free
            ? "Free"
            : event.ticket_price
            ? `₹${event.ticket_price}`
            : "Paid"}
        </div>
      </div>
    </main>
  );
}

/* ======================================================
   LOCALITY RENDERER
====================================================== */
async function renderLocality(path: string) {
  const slug = path.split("/").pop();

  const { data: locality } = await supabaseServer
    .from("localities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!locality) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-neutral-400">
        <Link href="/localities">Localities</Link> › {locality.name}
      </nav>

      <h1 className="text-3xl font-semibold">
        {locality.name}, Jaipur
      </h1>

      <p className="mt-3 text-neutral-300">
        Practical locality guide covering civic info, nearby areas,
        and events happening around {locality.name}.
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>Zone: {locality.zone || "—"}</div>
        <div>Ward: {locality.ward || "—"}</div>
        <div>PIN: {locality.pin_code || "—"}</div>
      </div>

      <div className="mt-6">
        <Link
          href={`/events?locality=${locality.slug}`}
          className="underline"
        >
          View events near {locality.name}
        </Link>
      </div>
    </main>
  );
}