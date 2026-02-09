// app/events/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function formatDate(dt: string | null | undefined, tz?: string | null) {
  if (!dt) return null;
  try {
    const d = new Date(dt);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: tz || "Asia/Kolkata",
    });
  } catch {
    return null;
  }
}

function formatTime(dt: string | null | undefined, tz?: string | null) {
  if (!dt) return null;
  try {
    const d = new Date(dt);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: tz || "Asia/Kolkata",
    });
  } catch {
    return null;
  }
}

function safeText(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

type EventRow = {
  id: string;
  slug: string;
  title: string | null;
  short_description: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  venue_name: string | null;
  locality: string | null;
  start_date: string | null;
  timezone: string | null;
  ticket_price: number | null;
  is_free: boolean | null;
  status: string | null;
  updated_at: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

const CATEGORY_LABELS: { key: string; label: string }[] = [
  { key: "music", label: "Music" },
  { key: "festival", label: "Festivals" },
  { key: "food", label: "Food & Dining" },
  { key: "comedy", label: "Comedy" },
  { key: "workshop", label: "Workshops" },
  { key: "sports", label: "Sports" },
  { key: "kids", label: "Kids & Family" },
  { key: "art", label: "Art & Culture" },
  { key: "nightlife", label: "Nightlife" },
];

export default async function EventsIndexPage() {
  const supabase = supabaseServer;

  const nowIso = new Date().toISOString();

  // Primary query: published-ish upcoming events
  const { data: rows, error } = await supabase
    .from("events")
    .select(
      [
        "id",
        "slug",
        "title",
        "short_description",
        "description",
        "city",
        "category",
        "venue_name",
        "locality",
        "start_date",
        "timezone",
        "ticket_price",
        "is_free",
        "status",
        "updated_at",
        "published_at",
        "meta_title",
        "meta_description",
      ].join(",")
    )
    .in("status", ["published", "active", "live"])
    .gte("start_date", nowIso)
    .order("start_date", { ascending: true })
    .limit(30);

  // Fallback: if your DB doesn’t use those status values yet
  let events: EventRow[] = (rows as any) || [];
  if ((!events || events.length === 0) && !error) {
    const fallback = await supabase
      .from("events")
      .select(
        [
          "id",
          "slug",
          "title",
          "short_description",
          "description",
          "city",
          "category",
          "venue_name",
          "locality",
          "start_date",
          "timezone",
          "ticket_price",
          "is_free",
          "status",
          "updated_at",
          "published_at",
          "meta_title",
          "meta_description",
        ].join(",")
      )
      .gte("start_date", nowIso)
      .order("start_date", { ascending: true })
      .limit(30);

    events = ((fallback.data as any) || []) as EventRow[];
  }

  const pageTitle = "Jaipur Events — Upcoming Events, Festivals, Concerts & More | JaipurCircle";
  const pageDesc =
    "Discover upcoming events in Jaipur: music, festivals, comedy, workshops, family events, and more. Dates, venues, ticket cues, and practical attendee notes — updated regularly.";

  // JSON-LD for list page (kept inline for SSR friendliness)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Jaipur Events",
    description: pageDesc,
    url: "https://www.jaipurcircle.com/events",
    isPartOf: {
      "@type": "WebSite",
      name: "JaipurCircle",
      url: "https://www.jaipurcircle.com",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (events || []).slice(0, 10).map((e, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://www.jaipurcircle.com/events/${e.slug}`,
        name: e.title || e.slug,
      })),
    },
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      {/* Minimal “SEO-ish” visible header content (actual <head> handled elsewhere in your stack) */}
      <h1 style={{ fontSize: 42, margin: "8px 0 6px" }}>Jaipur Events</h1>
      <p style={{ color: "#bbb", marginTop: 0, lineHeight: 1.6 }}>
        Upcoming concerts, festivals, workshops, comedy nights and family events — curated for fast lookup (date, venue, ticket cues).
      </p>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #333", borderRadius: 14 }}>
        <h2 style={{ marginTop: 0 }}>Browse by category</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          {CATEGORY_LABELS.map((c) => (
            <Link
              key={c.key}
              href={`/events/category/${encodeURIComponent(c.key)}`}
              style={{
                display: "inline-block",
                padding: "8px 12px",
                border: "1px solid #444",
                borderRadius: 999,
                textDecoration: "none",
                color: "white",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/events/category/all"
            style={{
              display: "inline-block",
              padding: "8px 12px",
              border: "1px solid #444",
              borderRadius: 999,
              textDecoration: "none",
              color: "white",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            All categories
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>Upcoming events</h2>

        {error && (
          <div style={{ marginTop: 10, padding: 12, border: "1px solid #552", borderRadius: 12, color: "#ffdb99" }}>
            Warning: Couldn’t fetch events list. Error: {safeText(error.message)}
          </div>
        )}

        {!error && (!events || events.length === 0) && (
          <div style={{ marginTop: 10, padding: 16, border: "1px solid #333", borderRadius: 12, color: "#bbb" }}>
            No upcoming events found right now. Check back soon.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
            marginTop: 12,
          }}
        >
          {(events || []).map((e) => {
            const dt = formatDate(e.start_date, e.timezone);
            const tm = formatTime(e.start_date, e.timezone);
            const venue = e.venue_name || "Venue to be announced";
            const city = e.city || "Jaipur";
            const title = e.title || "Untitled event";
            const category = (e.category || "").trim();
            const locality = (e.locality || "").trim();

            const priceText =
              e.is_free ? "Free" : e.ticket_price != null ? `₹${e.ticket_price} onwards` : "Tickets / pricing varies";

            const snippet =
              e.short_description ||
              (e.description ? e.description.slice(0, 140) + (e.description.length > 140 ? "…" : "") : "") ||
              "Practical details: date, time, venue, and attendee tips.";

            return (
              <article
                key={e.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 14,
                  padding: 14,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <h3 style={{ margin: "0 0 6px" }}>
                  <Link href={`/events/${encodeURIComponent(e.slug)}`} style={{ color: "white", textDecoration: "none" }}>
                    {title}
                  </Link>
                </h3>

                <div style={{ color: "#bbb", fontSize: 13, lineHeight: 1.6 }}>
                  {dt ? (
                    <div>
                      <b>Date:</b> {dt} {tm ? `• ${tm}` : ""} {e.timezone ? `(${e.timezone})` : ""}
                    </div>
                  ) : (
                    <div>
                      <b>Date:</b> TBA
                    </div>
                  )}
                  <div>
                    <b>Venue:</b> {venue}
                  </div>
                  <div>
                    <b>City:</b> {city}
                    {locality ? ` • ${locality}` : ""}
                  </div>
                  <div>
                    <b>Ticket:</b> {priceText}
                  </div>

                  {category ? (
                    <div style={{ marginTop: 6 }}>
                      <Link
                        href={`/events/category/${encodeURIComponent(category)}`}
                        style={{ color: "#ddd", textDecoration: "underline" }}
                      >
                        {category}
                      </Link>
                    </div>
                  ) : null}
                </div>

                <p style={{ marginTop: 10, color: "#cfcfcf", lineHeight: 1.6 }}>{snippet}</p>

                <div style={{ marginTop: 10 }}>
                  <Link
                    href={`/events/${encodeURIComponent(e.slug)}`}
                    style={{
                      display: "inline-block",
                      padding: "8px 10px",
                      border: "1px solid #444",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: "white",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    View details →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Fingerprint for smoke-test */}
      <div style={{ marginTop: 16, fontSize: 12, color: "#999" }}>FILE-FINGERPRINT: events-index-v1-2026-02-08</div>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}