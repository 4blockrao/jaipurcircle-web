// app/events/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/**
 * Helpers
 */
function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTimeRange(
  startIso?: string | null,
  endIso?: string | null,
  timezone?: string | null,
  isAllDay?: boolean | null
) {
  if (isAllDay) return "All day";
  if (!startIso) return null;

  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return null;

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  let out = fmt(start);
  if (endIso) {
    const end = new Date(endIso);
    if (!Number.isNaN(end.getTime())) out += ` – ${fmt(end)}`;
  }
  if (timezone) out += ` (${timezone})`;
  return out;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

function buildEventTitle(title: string, city: string, dateLabel?: string | null) {
  const bits = [title.trim(), `${city.trim()}`];
  if (dateLabel) bits.push(dateLabel);
  return `${bits.join(" — ")} | Tickets, Venue & Local Guide`;
}

function buildEventDescription(opts: {
  title: string;
  city: string;
  category?: string | null;
  venueName?: string | null;
  localityName?: string | null;
  dateLabel?: string | null;
  price?: number | null;
  isFree?: boolean | null;
  shortDescription?: string | null;
}) {
  const {
    title,
    city,
    category,
    venueName,
    localityName,
    dateLabel,
    price,
    isFree,
    shortDescription,
  } = opts;

  const sd = (shortDescription || "").trim();
  if (sd.length >= 60) {
    return sd.length > 160 ? sd.slice(0, 157) + "…" : sd;
  }

  const parts: string[] = [];
  parts.push(`${title} in ${city}.`);

  if (dateLabel) parts.push(`Date: ${dateLabel}.`);
  if (category) parts.push(`Category: ${category}.`);

  if (venueName && venueName.toLowerCase().includes("to be announced")) {
    parts.push(`Venue is yet to be announced — we’ll update once verified.`);
  } else if (venueName) {
    parts.push(`Venue: ${venueName}${localityName ? `, ${localityName}` : ""}.`);
  } else if (localityName) {
    parts.push(`Location: ${localityName}, ${city}.`);
  }

  if (isFree) parts.push(`Entry is free.`);
  else if (typeof price === "number") parts.push(`Tickets from ₹${price}.`);

  parts.push(`See attendee tips, directions context, and more Jaipur events on JaipurCircle.`);

  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > 160 ? text.slice(0, 157) + "…" : text;
}

async function getPageRegistry(path: string) {
  const { data, error } = await supabaseServer
    .from("page_registry")
    .select("page_type, canonical_url, index_state, url_path, entity_table, entity_id, entity_key")
    .eq("url_path", path)
    .maybeSingle();

  return { reg: data ?? null, regError: error ?? null };
}

async function getEventBySlug(slug: string) {
  const { data, error } = await supabaseServer
    .from("events")
    .select(
      [
        "id",
        "title",
        "slug",
        "short_description",
        "description",
        "start_date",
        "end_date",
        "timezone",
        "is_all_day",
        "venue_name",
        "venue_address",
        "locality",
        "category",
        "tags",
        "cover_image",
        "gallery_images",
        "is_free",
        "ticket_price",
        "registration_url",
        "registration_deadline",
        "status",
        "updated_at",
        "published_at",
        "meta_title",
        "meta_description",
        "is_online",
        "online_url",
        "latitude",
        "longitude",
        "organizer_name",
        "organizer_email",
        "organizer_phone",
      ].join(",")
    )
    .eq("slug", slug)
    .maybeSingle();

  return { event: data ?? null, eventError: error ?? null };
}

async function resolveLocalitySlugFromEventLocality(locality: string | null) {
  if (!locality) return null;

  const looksLikeSlug = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(locality.trim().toLowerCase());
  const candidateSlug = looksLikeSlug ? locality.trim().toLowerCase() : slugify(locality);

  const { data: bySlug } = await supabaseServer
    .from("localities")
    .select("slug,name")
    .eq("slug", candidateSlug)
    .maybeSingle();

  if (bySlug?.slug) return bySlug.slug;

  const { data: byName } = await supabaseServer
    .from("localities")
    .select("slug,name")
    .ilike("name", locality)
    .maybeSingle();

  if (byName?.slug) return byName.slug;

  return null;
}

/**
 * SEO: Metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = `/events/${slug}`;

  // ✅ FIX: do NOT destructure Promise.all (prevents union-widening)
  const regResPromise = getPageRegistry(path);
  const eventResPromise = getEventBySlug(slug);

  const regRes = await regResPromise;
  const eventRes = await eventResPromise;

  const reg = regRes.reg;
  const event = eventRes.event;

  const city = "Jaipur";
  const titleBase = safeText(event?.meta_title) || safeText(event?.title) || "Event";
  const dateLabel = fmtDate(event?.start_date ?? null);

  const canonical = reg?.canonical_url?.trim() || `https://www.jaipurcircle.com${path}`;
  const shouldIndex = !reg?.index_state || reg.index_state === "index";

  const description =
    safeText(event?.meta_description) ||
    buildEventDescription({
      title: titleBase,
      city,
      category: event?.category ?? null,
      venueName: event?.venue_name ?? null,
      localityName: event?.locality ?? null,
      dateLabel,
      price: typeof event?.ticket_price === "number" ? event.ticket_price : null,
      isFree: event?.is_free ?? null,
      shortDescription: event?.short_description ?? null,
    });

  const title =
    safeText(event?.meta_title) || buildEventTitle(titleBase, city, dateLabel);

  const ogImage = safeText(event?.cover_image) || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Page
 */
export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = `/events/${slug}`;

  // ✅ FIX: same here
  const regResPromise = getPageRegistry(path);
  const eventResPromise = getEventBySlug(slug);

  const regRes = await regResPromise;
  const eventRes = await eventResPromise;

  const reg = regRes.reg;
  const regError = regRes.regError;

  const event = eventRes.event;
  const eventError = eventRes.eventError;

  if (regError) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Server error</h1>
        <p>page_registry lookup failed.</p>
        <pre>{String((regError as any).message || regError)}</pre>
        <p>Path:</p>
        <pre>{path}</pre>
      </main>
    );
  }

  if (eventError) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Server error</h1>
        <p>events lookup failed.</p>
        <pre>{String((eventError as any).message || eventError)}</pre>
        <p>Slug:</p>
        <pre>{slug}</pre>
      </main>
    );
  }

  if (!event) notFound();

  const title = safeText(event.title) || "Event";
  const city = "Jaipur";
  const category = safeText(event.category) || "";
  const venueName = safeText(event.venue_name) || "Venue To Be Announced";
  const venueAddress = safeText(event.venue_address) || "";
  const localityName = safeText(event.locality) || "";

  const startDateLabel = fmtDate(event.start_date ?? null);
  const timeLabel = fmtTimeRange(
    event.start_date ?? null,
    event.end_date ?? null,
    event.timezone ?? null,
    event.is_all_day ?? null
  );

  const isFree = Boolean(event.is_free);
  const ticketPrice = typeof event.ticket_price === "number" ? event.ticket_price : null;

  const regDeadline = event.registration_deadline ? fmtDate(event.registration_deadline) : null;

  const localitySlug = await resolveLocalitySlugFromEventLocality(event.locality ?? null);

  const crumbs = [
    { name: "Home", url: "https://www.jaipurcircle.com/" },
    { name: "Events", url: "https://www.jaipurcircle.com/events" },
    { name: title, url: `https://www.jaipurcircle.com/events/${slug}` },
  ];

  const eventJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: event.start_date ?? undefined,
    endDate: event.end_date ?? undefined,
    eventAttendanceMode: event.is_online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.is_online
      ? {
          "@type": "VirtualLocation",
          url: event.online_url || event.registration_url || undefined,
        }
      : {
          "@type": "Place",
          name: venueName,
          address: {
            "@type": "PostalAddress",
            addressLocality: localityName || undefined,
            addressRegion: "Rajasthan",
            addressCountry: "IN",
            streetAddress: venueAddress || undefined,
          },
          geo:
            typeof event.latitude === "number" && typeof event.longitude === "number"
              ? {
                  "@type": "GeoCoordinates",
                  latitude: event.latitude,
                  longitude: event.longitude,
                }
              : undefined,
        },
    image: safeText(event.cover_image) ? [event.cover_image] : undefined,
    description: safeText(event.short_description || event.description) || undefined,
    organizer: safeText(event.organizer_name)
      ? {
          "@type": "Organization",
          name: event.organizer_name,
          email: event.organizer_email || undefined,
          telephone: event.organizer_phone || undefined,
        }
      : undefined,
    offers:
      isFree || ticketPrice != null
        ? {
            "@type": "Offer",
            priceCurrency: "INR",
            price: isFree ? 0 : ticketPrice ?? undefined,
            url: event.registration_url || undefined,
            availability: "https://schema.org/InStock",
          }
        : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.name,
      item: c.url,
    })),
  };

  const isVenueTbd = venueName.toLowerCase().includes("to be announced");
  const locationLine = isVenueTbd
    ? `Venue is yet to be announced. We’ll update this page as soon as it’s verified.`
    : localityName
      ? `This event is happening in ${localityName}, ${city}.`
      : `This event is happening in ${city}.`;

  const localGuideLine = localitySlug
    ? `Want locality context? See the area guide for ${localityName || localitySlug}.`
    : localityName
      ? `We’ll link the locality guide once we match this location to JaipurCircle’s locality index.`
      : `We’ll add locality guidance once the venue is verified.`;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      <nav style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
        {crumbs.map((c, i) => (
          <span key={c.url}>
            {i > 0 ? " › " : ""}
            <a href={new URL(c.url).pathname} style={{ color: "#444", textDecoration: "none" }}>
              {c.name}
            </a>
          </span>
        ))}
      </nav>

      <h1 style={{ margin: "6px 0 6px" }}>
        {title} — {city}
      </h1>

      <div style={{ color: "#444", fontSize: 14, marginBottom: 14 }}>
        {category ? (
          <>
            <b>Category:</b> {category} &nbsp;•&nbsp;
          </>
        ) : null}
        <b>Venue:</b> {venueName}
        {localityName ? <> &nbsp;•&nbsp; {localityName}</> : null}
      </div>

      <section style={{ marginTop: 12, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Event quick info</h2>
        <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
          {startDateLabel && (
            <li>
              <b>Date:</b> {startDateLabel}
            </li>
          )}
          {timeLabel && (
            <li>
              <b>Time:</b> {timeLabel}
            </li>
          )}
          <li>
            <b>City:</b> {city}
          </li>
          <li>
            <b>Venue:</b> {venueName}
          </li>
          {venueAddress ? (
            <li>
              <b>Address:</b> {venueAddress}
            </li>
          ) : null}
          {localityName ? (
            <li>
              <b>Locality:</b> {localityName}
            </li>
          ) : null}
          {isFree ? (
            <li>
              <b>Ticket price:</b> Free
            </li>
          ) : ticketPrice != null ? (
            <li>
              <b>Ticket price:</b> ₹{ticketPrice} onwards
            </li>
          ) : null}
          {event.registration_url ? (
            <li>
              <b>Registration:</b>{" "}
              <a href={event.registration_url} rel="nofollow">
                {event.registration_url}
              </a>
              {regDeadline ? <> (deadline: {regDeadline})</> : null}
            </li>
          ) : null}
        </ul>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>About this event in Jaipur</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 10 }}>{locationLine}</p>
        <p style={{ lineHeight: 1.7, marginTop: 0 }}>
          JaipurCircle pages are built for searchers who want the essentials fast: date/time, venue + locality context,
          ticket cues, and practical attendee tips. {localGuideLine}
        </p>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Quick attendee notes</h2>
        <ul style={{ lineHeight: 1.7 }}>
          <li>Arrive 20–30 minutes early for entry checks and parking.</li>
          <li>Carry a valid ID and keep your e-ticket handy on phone.</li>
          <li>Expect peak cab demand after the event — book ahead if possible.</li>
          {!isVenueTbd ? <li>Confirm venue gate/entry details from the organizer on the day of the event.</li> : null}
        </ul>
      </section>

      {(event.short_description || event.description) ? (
        <section style={{ marginTop: 16 }}>
          <h2>Event details</h2>
          <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {event.short_description || event.description}
          </p>
        </section>
      ) : null}

      <section style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Explore more</h2>
        <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
          <li>
            <a href="/events">All Jaipur events</a>
          </li>
          <li>
            <a href="/categories">Browse categories</a>
          </li>
          {localitySlug ? (
            <li>
              <a href={`/events/in/${localitySlug}`}>More events in {localityName || localitySlug}</a>
            </li>
          ) : null}
          {localitySlug ? (
            <li>
              <a href={`/jaipur/${localitySlug}`}>Locality guide: {localityName || localitySlug}</a>
            </li>
          ) : null}
        </ul>
      </section>

      <div style={{ marginTop: 12, fontSize: 12, color: "#999" }}>
        FILE-FINGERPRINT: events-v1-2026-02-09-vercel-fix
      </div>
    </main>
  );
}