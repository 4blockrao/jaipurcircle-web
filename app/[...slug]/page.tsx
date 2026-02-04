import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "../../lib/supabaseServer";

export const dynamic = "force-dynamic";

const SITE = "https://www.jaipurcircle.com";

function buildPath(slug?: string[]) {
  return "/" + (slug ?? []).join("/");
}

function toText(x: any): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  if (Array.isArray(x)) return x.map(toText).filter(Boolean).join(", ");
  if (typeof x === "object") {
    // common object shapes
    if (typeof x.name === "string") return x.name;
    if (typeof x.title === "string") return x.title;
    return "";
  }
  return "";
}

function uniqStrings(arr: any[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of arr || []) {
    const s = toText(v).trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function titleCaseSlug(s: string) {
  return (s || "")
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function safeSlugFromPath(path: string) {
  // path like /jaipur/vaishali-nagar
  const parts = path.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0].toLowerCase() === "jaipur") return parts[1];
  return parts[parts.length - 1] || "";
}

type PageRegistryRow = {
  page_type: string;
  entity_table: string | null;
  entity_id: string | null;
  entity_key: string | null;
  url_path: string;
  canonical_url: string | null;
  index_state: "index" | "noindex" | string | null;
};

type LocalityRow = {
  id: number;
  name: string | null;
  slug: string;
  zone: string | null;
  municipality: string | null;
  ward_number: number | null;
  ward_name: string | null;
  police_station: string | null;
  pin_codes: any;
  assembly_constituency: string | null;
  population_estimate: number | null;
  geo_lat: number | null;
  geo_lng: number | null;
  micro_localities: any;
  nearby_localities: any;
  adjacent_localities: any;
  major_landmarks: any;
  connectivity: any;
  tags: any;
};

async function fetchPageRegistry(path: string) {
  const { data, error } = await supabaseServer
    .from("page_registry")
    .select("page_type,entity_table,entity_id,entity_key,url_path,canonical_url,index_state")
    .eq("url_path", path)
    .maybeSingle();

  if (error) throw error;
  return (data as PageRegistryRow | null) || null;
}

async function fetchLocalityBySlug(slug: string) {
  const { data, error } = await supabaseServer
    .from("localities")
    .select(
      "id,name,slug,zone,municipality,ward_number,ward_name,police_station,pin_codes,assembly_constituency,population_estimate,geo_lat,geo_lng,micro_localities,nearby_localities,adjacent_localities,major_landmarks,connectivity,tags"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return (data as LocalityRow | null) || null;
}

function buildLocalityMeta(locality: LocalityRow) {
  const name = locality.name || titleCaseSlug(locality.slug);
  const pin = uniqStrings(Array.isArray(locality.pin_codes) ? locality.pin_codes : [locality.pin_codes])[0] || "";
  const zone = locality.zone ? toText(locality.zone) : "";
  const ward = locality.ward_number != null ? `Ward ${locality.ward_number}` : "";
  const ps = locality.police_station ? toText(locality.police_station) : "";

  const title = `${name}, Jaipur — Locality Guide`;
  const descParts = [
    `Explore ${name} in Jaipur`,
    zone ? `in ${zone}` : "",
    pin ? `PIN ${pin}` : "",
    ward ? `${ward}` : "",
    ps ? `Police station: ${ps}` : "",
    `with civic info, nearby areas, services, and things to do.`,
  ]
    .filter(Boolean)
    .join(". ")
    .replace(/\.\s+\./g, ".");

  const description = descParts.length > 160 ? descParts.slice(0, 157) + "…" : descParts;

  return { title, description };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = buildPath(slug);

  // canonical + robots from registry if present
  let registry: PageRegistryRow | null = null;
  try {
    registry = await fetchPageRegistry(path);
  } catch {
    registry = null;
  }

  const canonical = registry?.canonical_url || `${SITE}${path}`;
  const shouldIndex = !registry?.index_state || registry.index_state === "index";

  // Locality-specific meta fallback (important for rollout)
  const localitySlug = safeSlugFromPath(path);
  const locality = localitySlug ? await fetchLocalityBySlug(localitySlug) : null;
  const meta = locality ? buildLocalityMeta(locality) : { title: "JaipurCircle", description: "Locality guides and civic information for Jaipur." };

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      type: "article",
    },
  };
}

function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = buildPath(slug);

  // 1) Try registry
  let registry: PageRegistryRow | null = null;
  try {
    registry = await fetchPageRegistry(path);
  } catch {
    registry = null;
  }

  // Locality rollout behavior:
  // If URL is /jaipur/:localitySlug, we render from localities even if registry is missing.
  const localitySlug = safeSlugFromPath(path);

  if (!localitySlug || !path.startsWith("/jaipur/")) {
    // Not a locality route; keep current behavior strict
    if (!registry) notFound();
    // You can extend other page types later (zone/category/etc)
    notFound();
  }

  const locality = await fetchLocalityBySlug(localitySlug);
  if (!locality) notFound();

  const canonical = registry?.canonical_url || `${SITE}${path}`;
  const robots = !registry?.index_state || registry.index_state === "index" ? "index, follow" : "noindex, nofollow";

  const name = locality.name || titleCaseSlug(locality.slug);
  const pinList = uniqStrings(Array.isArray(locality.pin_codes) ? locality.pin_codes : [locality.pin_codes]);
  const pin = pinList[0] || "";
  const zone = locality.zone ? toText(locality.zone) : "";
  const municipality = locality.municipality ? toText(locality.municipality) : "";
  const wardNo = locality.ward_number != null ? String(locality.ward_number) : "";
  const wardName = locality.ward_name ? toText(locality.ward_name) : "";
  const police = locality.police_station ? toText(locality.police_station) : "";
  const assembly = locality.assembly_constituency ? toText(locality.assembly_constituency) : "";
  const population = locality.population_estimate != null ? String(locality.population_estimate) : "";
  const coords =
    locality.geo_lat != null && locality.geo_lng != null ? `${locality.geo_lat.toFixed(4)}, ${locality.geo_lng.toFixed(4)}` : "";

  const tags = uniqStrings(Array.isArray(locality.tags) ? locality.tags : [locality.tags]).slice(0, 8);

  const micro = uniqStrings(Array.isArray(locality.micro_localities) ? locality.micro_localities : [locality.micro_localities]).slice(0, 12);
  const nearby = uniqStrings(Array.isArray(locality.nearby_localities) ? locality.nearby_localities : [locality.nearby_localities]).slice(0, 12);
  const adjacent = uniqStrings(Array.isArray(locality.adjacent_localities) ? locality.adjacent_localities : [locality.adjacent_localities]).slice(0, 12);
  const landmarks = uniqStrings(Array.isArray(locality.major_landmarks) ? locality.major_landmarks : [locality.major_landmarks]).slice(0, 10);

  // connectivity can be object; render as label/value lines
  const connectivityObj = locality.connectivity && typeof locality.connectivity === "object" && !Array.isArray(locality.connectivity) ? locality.connectivity : null;
  const connectivityLines = connectivityObj
    ? Object.entries(connectivityObj)
        .map(([k, v]) => ({ k: String(k), v: toText(v) }))
        .filter((x) => x.v)
        .slice(0, 12)
    : [];

  // Breadcrumbs
  const crumbs = [
    { name: "Home", url: `${SITE}/` },
    { name: "Jaipur", url: `${SITE}/jaipur` },
    ...(zone ? [{ name: zone, url: `${SITE}/jaipur/zones` }] : []),
    { name, url: canonical },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };

  const placeLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${name}, Jaipur`,
    url: canonical,
    ...(coords
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: locality.geo_lat,
            longitude: locality.geo_lng,
          },
        }
      : {}),
    ...(pin
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: "Jaipur",
            addressRegion: "Rajasthan",
            postalCode: pin,
            addressCountry: "IN",
          },
        }
      : {}),
  };

  // Human-ish intro (anti-thin; still factual)
  const intro = [
    `If you're planning to live here (or just visiting), this page is a quick, reliable starting point — civic basics, getting around, and nearby neighbourhoods you’ll likely search next.`,
    `You’ll find ward and police-station details, connectivity notes, local landmarks, and links to explore services and categories around ${name}.`,
  ];

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={placeLd} />

      {/* Breadcrumbs */}
      <nav style={{ fontSize: 14, opacity: 0.9, marginBottom: 12 }}>
        {crumbs.map((c, i) => (
          <span key={`bc-${i}-${c.url}`}>
            <a href={c.url} style={{ textDecoration: "underline" }}>
              {c.name}
            </a>
            {i < crumbs.length - 1 ? " / " : ""}
          </span>
        ))}
      </nav>

      {/* H1 */}
      <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "8px 0 10px" }}>{name}, Jaipur</h1>

      <p style={{ fontSize: 18, opacity: 0.9, marginTop: 0 }}>
        {name}, Jaipur locality guide
        {zone ? `. Zone: ${zone}` : ""}
        {wardNo ? ` • Ward: ${wardNo}` : ""}
        {police ? ` • PS: ${police}` : ""}
        {pin ? ` • PIN ${pin}` : ""}
      </p>

      <p style={{ opacity: 0.75, marginTop: 4 }}>
        <b>Path:</b> {path}
      </p>

      {/* Locality overview card */}
      <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18, marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Locality overview</h2>
        {intro.map((p, idx) => (
          <p key={`intro-${idx}`} style={{ marginTop: idx === 0 ? 0 : 10, opacity: 0.92 }}>
            {p}
          </p>
        ))}

        <p style={{ marginTop: 12, opacity: 0.92 }}>
          <b>At a glance:</b>
          {zone ? ` Zone: ${zone} •` : ""}
          {municipality ? ` Municipality: ${municipality} •` : ""}
          {wardNo ? ` Ward: ${wardNo}${wardName ? ` (${wardName})` : ""} •` : ""}
          {police ? ` Police station: ${police} •` : ""}
          {pin ? ` PIN: ${pin}` : ""}
        </p>

        {tags.length > 0 && (
          <p style={{ marginTop: 10, opacity: 0.9 }}>
            <b>Tags:</b> {tags.join(", ")}
          </p>
        )}
      </section>

      {/* Quick facts */}
      <h2 style={{ marginTop: 28 }}>Quick facts</h2>
      <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", rowGap: 10, columnGap: 18 }}>
          {pin && (
            <>
              <div>
                <b>PIN:</b>
              </div>
              <div>{pin}</div>
            </>
          )}
          {zone && (
            <>
              <div>
                <b>Zone:</b>
              </div>
              <div>{zone}</div>
            </>
          )}
          {municipality && (
            <>
              <div>
                <b>Municipality:</b>
              </div>
              <div>{municipality}</div>
            </>
          )}
          {wardNo && (
            <>
              <div>
                <b>Ward:</b>
              </div>
              <div>
                {wardNo}
                {wardName ? ` (${wardName})` : ""}
              </div>
            </>
          )}
          {police && (
            <>
              <div>
                <b>Police station:</b>
              </div>
              <div>{police}</div>
            </>
          )}
          {assembly && (
            <>
              <div>
                <b>Assembly constituency:</b>
              </div>
              <div>{assembly}</div>
            </>
          )}
          {population && (
            <>
              <div>
                <b>Population (estimate):</b>
              </div>
              <div>{population}</div>
            </>
          )}
          {coords && (
            <>
              <div>
                <b>Coordinates:</b>
              </div>
              <div>{coords}</div>
            </>
          )}
        </div>
      </section>

      {/* Getting around */}
      <h2 style={{ marginTop: 28 }}>Getting around & landmarks</h2>
      <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18 }}>
        {connectivityLines.length > 0 && (
          <>
            <h3 style={{ marginTop: 0 }}>Connectivity</h3>
            <ul>
              {connectivityLines.map((line, idx) => (
                <li key={`conn-${idx}-${line.k}`}>
                  <b>{line.k}:</b> {line.v}
                </li>
              ))}
            </ul>
          </>
        )}

        {landmarks.length > 0 && (
          <>
            <h3>Major landmarks</h3>
            <ul>
              {landmarks.map((l, idx) => (
                <li key={`lm-${idx}-${l.toLowerCase()}`}>{l}</li>
              ))}
            </ul>
          </>
        )}

        {micro.length > 0 && (
          <>
            <h3>Micro-localities</h3>
            <p style={{ opacity: 0.9 }}>{micro.join(", ")}</p>
          </>
        )}
      </section>

      {/* Nearby */}
      <h2 style={{ marginTop: 28 }}>Nearby areas</h2>
      <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18 }}>
        {nearby.length > 0 && (
          <>
            <h3 style={{ marginTop: 0 }}>Nearby localities</h3>
            <ul>
              {nearby.map((n, idx) => (
                <li key={`near-${idx}-${n.toLowerCase()}`}>
                  <a href={`/jaipur/${n.toLowerCase().replace(/\s+/g, "-")}`} style={{ textDecoration: "underline" }}>
                    {n}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {adjacent.length > 0 && (
          <>
            <h3>Adjacent localities</h3>
            <p style={{ opacity: 0.9 }}>{adjacent.join(", ")}</p>
          </>
        )}
      </section>

      {/* FAQs */}
      <h2 style={{ marginTop: 28 }}>FAQs</h2>
      <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18 }}>
        <p>
          <b>What is the PIN code of {name}?</b>
          <br />
          {pin ? `${name} commonly uses PIN code(s) ${pin}.` : "PIN codes for this locality will be added soon."}
        </p>

        <p>
          <b>Which ward does {name} fall under?</b>
          <br />
          {wardNo ? `${name} falls under Ward ${wardNo}${wardName ? ` (${wardName})` : ""}.` : "Ward details will be added soon."}
        </p>

        <p>
          <b>Which police station covers the area?</b>
          <br />
          {police ? `${name} is typically covered by ${police} police station.` : "Police station details will be added soon."}
        </p>

        <p>
          <b>Which localities are near {name}?</b>
          <br />
          {nearby.length ? `Nearby localities include ${nearby.slice(0, 6).join(", ")}.` : "Nearby localities will be added soon."}
        </p>
      </section>

      {/* Intent links */}
      <h2 style={{ marginTop: 28 }}>People also search for</h2>
      <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            `flats in ${name}`,
            `pg rooms in ${name}`,
            `schools near ${name}`,
            `hospitals in ${name}`,
            `${name} pin code`,
            `${name} police station`,
            `${name} ward number`,
            `connectivity to ${name}`,
            `markets in ${name}`,
          ].map((q, idx) => (
            <span
              key={`q-${idx}`}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 14,
                opacity: 0.9,
              }}
            >
              {q}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 14, opacity: 0.9 }}>
          <b>Explore more on JaipurCircle:</b>{" "}
          <a href="/jaipur" style={{ textDecoration: "underline" }}>
            All Jaipur localities
          </a>{" "}
          •{" "}
          <a href="/news" style={{ textDecoration: "underline" }}>
            Jaipur news
          </a>{" "}
          •{" "}
          <a href="/events" style={{ textDecoration: "underline" }}>
            Events in Jaipur
          </a>{" "}
          •{" "}
          <a href="/deals" style={{ textDecoration: "underline" }}>
            Deals in Jaipur
          </a>
        </div>
      </section>

      <div style={{ marginTop: 24, opacity: 0.75, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 12 }}>
        ✅ Rendered from Supabase (SSR) • robots: {robots}
      </div>
    </main>
  );
}