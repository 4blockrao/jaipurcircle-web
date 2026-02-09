// app/events/category/[category]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const CATEGORY_LABELS: Record<string, string> = {
  music: "Music",
  festival: "Festivals",
  food: "Food & Dining",
  comedy: "Comedy",
  workshop: "Workshops",
  sports: "Sports",
  kids: "Kids & Family",
  art: "Art & Culture",
  nightlife: "Nightlife",
  all: "All categories",
};

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
};

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

// Next 16: params is a Promise
type Props = { params: Promise<{ category: string }> };

export default async function EventsCategoryPage({ params }: Props) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory || "").trim().toLowerCase();

  if (!category) notFound();
  if (!CATEGORY_LABELS[category]) notFound();

  const label = CATEGORY_LABELS[category];
  const nowIso = new Date().toISOString();

  let query = supabaseServer
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
      ].join(",")
    )
    .in("status", ["published", "active", "live"])
    .gte("start_date", nowIso)
    .order("start_date", { ascending: true })
    .limit(60);

  if (category !== "all") {
    query = query.eq("category", category);
  }

  const { data: rows, error } = await query;

  const events: EventRow[] = (rows as any) || [];

  const pageTitle =
    category === "all"
      ? "Jaipur Events — All Categories | JaipurCircle"
      : `Jaipur ${label} Events — Upcoming ${label} | JaipurCircle`;

  const pageDesc =
    category === "all"
      ? "Browse all upcoming events in Jaipur across categories — concerts, festivals, comedy, workshops, sports and more."
      : `Browse upcoming ${label.toLowerCase()} events in Jaipur — dates, venues, ticket cues and practical attendee notes.`;

  const baseUrl = process.env.SITE_URL || "https://www.jaipurcircle.com";
  const canonicalUrl = `${baseUrl}/events/category/${encodeURIComponent(category)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category === "all" ? "Jaipur Events" : `Jaipur ${label} Events`,
    description: pageDesc,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "JaipurCircle",
      url: baseUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: events.slice(0, 10).map((e, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${baseUrl}/events/${e.slug}`,
        name: e.title || e.slug,
      })),
    },
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Link href="/events" style={{ color: "white", textDecoration: "underline" }}>
          ← All Events
        </Link>
        <span style={{ color: "#888" }}>/</span>
        <span style={{ color: "#bbb" }}>
          Category: <b style={{ color: "white" }}>{label}</b>
        </span>
      </div>

      <h1 style={{ fontSize: 38, margin: "8px 0 6px" }}>
        {category === "all" ? "Jaipur Events" : `Jaipur ${label} Events`}
      </h1>
      <p style={{ color: "#bbb", marginTop: 0, lineHeight: 1.6 }}>{pageDesc}</p>

      <section style={{ marginTop: 16, padding: 16, border: "1px solid #333", borderRadius: 14 }}>
        <h2 style={{ marginTop: 0 }}>Browse categories</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => {
            const active = key === category;
            return (
              <Link
                key={key}
                href={`/events/category/${encodeURIComponent(key)}`}
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  border: "1px solid #444",
                  borderRadius: 999,
                  textDecoration: "none",
                  color: "white",
                  background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                }}
              >
                {lbl}
              </Link>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ marginBottom: 8 }}>Upcoming</h2>

        {error && (
          <div style={{ marginTop: 10, padding: 12, border: "1px solid #552", borderRadius: 12, color: "#ffdb99" }}>
            Warning: Couldn’t fetch category events. Error: {safeText(error.message)}
          </div>
        )}

        {!error && events.length === 0 && (
          <div style={{ marginTop: 10, padding: 16, border: "1px solid #333", borderRadius: 12, color: "#bbb" }}>
            No upcoming events found for <b>{label}</b>. Try another category.
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
          {events.map((e) => {
            const dt = formatDate(e.start_date, e.timezone);
            const tm = formatTime(e.start_date, e.timezone);
            const venue = e.venue_name || "Venue to be announced";
            const city = e.city || "Jaipur";
            const title = e.title || "Untitled event";
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

      <div style={{ marginTop: 16, fontSize: 12, color: "#999" }}>
        FILE-FINGERPRINT: events-category-v1-2026-02-08
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
