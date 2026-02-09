// app/events/locality/[locality]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  start_date?: string | null;
  timezone?: string | null;
  venue_name?: string | null;
  ticket_price?: number | null;
  is_free?: boolean | null;
  category?: string | null;
};

function formatDateTime(iso?: string | null, tz?: string | null) {
  if (!iso) return "TBA";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: tz || "Asia/Kolkata",
    });
  } catch {
    return iso;
  }
}

export async function generateMetadata({ params }: { params: { locality: string } }) {
  const locality = params?.locality;
  if (!locality) return {};

  // Optional: pull locality name for nicer titles
  const { data: loc } = await supabaseServer
    .from("localities")
    .select("name")
    .eq("slug", locality)
    .maybeSingle();

  const name = loc?.name || locality;

  const title = `Events in ${name} (Jaipur) | JaipurCircle`;
  const description = `Browse upcoming events in ${name}, Jaipur — date/time, venue cues, ticket info, and local context.`;
  const canonical = `https://www.jaipurcircle.com/events/locality/${encodeURIComponent(locality)}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function EventsLocalityPage({ params }: { params: { locality: string } }) {
  const locality = params?.locality?.toLowerCase();
  if (!locality) notFound();

  const { data: loc } = await supabaseServer
    .from("localities")
    .select("name, slug")
    .eq("slug", locality)
    .maybeSingle();

  // If you want strict locality-only pages:
  if (!loc) notFound();

  const { data, error } = await supabaseServer
    .from("events")
    .select("id, title, slug, short_description, start_date, timezone, venue_name, ticket_price, is_free, category")
    .eq("status", "published")
    .ilike("locality", locality)
    .order("start_date", { ascending: true })
    .limit(60);

  const events: EventRow[] = data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="text-sm text-neutral-500">
        <Link className="hover:underline" href="/">Home</Link>
        <span className="mx-2">›</span>
        <Link className="hover:underline" href="/events">Events</Link>
        <span className="mx-2">›</span>
        <Link className="hover:underline" href="/localities">Localities</Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-200">{loc.name}</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold">
        Events in {loc.name} (Jaipur)
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Upcoming events tagged to {loc.name}. We’ll improve coverage as more venues get verified.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Failed to load events: {error.message}
        </div>
      )}

      {events.length === 0 ? (
        <div className="mt-6 rounded-xl border border-neutral-200 p-6 text-sm text-neutral-600">
          No events found for this locality yet.
          <div className="mt-3">
            <Link className="underline" href="/events">Browse all events</Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <div key={e.id} className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-base font-medium">{e.title}</div>
              <div className="mt-2 text-xs text-neutral-500">
                <div><b>Date:</b> {formatDateTime(e.start_date, e.timezone)}</div>
                <div><b>Venue:</b> {e.venue_name || "TBA"}</div>
                <div><b>Category:</b> {e.category || "events"}</div>
                <div>
                  <b>Ticket:</b>{" "}
                  {e.is_free ? "Free" : e.ticket_price ? `₹${e.ticket_price} onwards` : "TBA"}
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-400 line-clamp-3">
                {e.short_description || "See full details for timings, venue info, and registration."}
              </p>
              <Link
                href={`/events/${encodeURIComponent(e.slug)}`}
                className="mt-4 inline-flex rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:border-neutral-300"
              >
                View details →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 text-xs text-neutral-400">
        FILE-FINGERPRINT: events-locality-v1
      </div>
    </main>
  );
}