/**
 * Crawler meta injection for the client-rendered SPA.
 *
 * WhatsApp, Facebook, LinkedIn, Twitter/X and Slack never execute JavaScript,
 * so the react-helmet tags on /properties/:id and /agencies/:id are invisible
 * to them — every shared listing previewed as a bare, imageless card. This
 * function serves the *same* index.html with the <title>, description, OG tags
 * and JSON-LD already filled in from the API.
 *
 * Only crawler user-agents are routed here (see the `has` rules in
 * vercel.json), so human traffic is untouched and pays no latency.
 */

export const config = { runtime: "edge" };

const APP_URL = "https://app.letsellr.in";
const SITE_NAME = "Letsellr";
const DEFAULT_DESCRIPTION =
  "Search verified properties for sale, rent, and lease directly from owners and agencies - no brokerage on Letsellr.";
const DEFAULT_IMAGE = `${APP_URL}/og-image.jpg`;

const OFFER_AVAILABILITY = {
  live: "https://schema.org/InStock",
  rented: "https://schema.org/SoldOut",
  sold: "https://schema.org/SoldOut",
};

function apiBase() {
  return (
    process.env.VITE_API_URL ||
    process.env.API_URL ||
    "https://api.letsellr.in"
  );
}

/** Escapes a value for safe interpolation into an HTML attribute. */
function attr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** JSON-LD sits in a <script> block, so only the closing-tag sequence is unsafe. */
function jsonLdSafe(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

function truncate(text, max = 300) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function formatPrice(price, unit) {
  if (price == null) return "";
  const n = Number(price);
  let amount;
  if (n >= 10000000) amount = `₹${(n / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  else if (n >= 100000) amount = `₹${(n / 100000).toFixed(2).replace(/\.00$/, "")} Lakh`;
  else amount = `₹${n.toLocaleString("en-IN")}`;
  return unit && unit !== "total" ? `${amount} / ${unit}` : amount;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return null;
  return res.json();
}

function buildPropertyMeta(property) {
  const location = property.location_area || property.location_city || "";
  const canonical = `${APP_URL}/properties/${property.id}`;
  const title = `${property.title}${location ? ` in ${location}` : ""}`;
  const price = formatPrice(property.price, property.price_unit);
  const description = truncate(
    `${title} - ${price}. ${property.bedrooms ? `${property.bedrooms} BHK, ` : ""}` +
      `verified listing direct from ${property.owner_role === "agency" ? "agency" : "owner"}, ` +
      `no brokerage on ${SITE_NAME}.`
  );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: property.title,
      description: truncate(property.description || property.title, 500),
      url: canonical,
      datePosted: property.created_at,
      dateModified: property.updated_at,
      image: property.photos?.length ? property.photos : undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: property.location_address || undefined,
        addressLocality: property.location_area || property.location_city,
        addressRegion: property.location_state,
        postalCode: property.location_pincode,
        addressCountry: "IN",
      },
      geo:
        property.latitude != null && property.longitude != null
          ? {
              "@type": "GeoCoordinates",
              latitude: property.latitude,
              longitude: property.longitude,
            }
          : undefined,
      about: {
        "@type": "Accommodation",
        name: property.title,
        numberOfRooms: property.bedrooms ?? undefined,
        numberOfBathroomsTotal: property.bathrooms ?? undefined,
        floorSize: property.area
          ? { "@type": "QuantitativeValue", value: property.area, unitCode: "FTK" }
          : undefined,
      },
      offers: {
        "@type": "Offer",
        price: property.price,
        priceCurrency: "INR",
        availability: OFFER_AVAILABILITY[property.status] || "https://schema.org/InStock",
        url: canonical,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Home", url: `${APP_URL}/dashboard` },
        { name: "Properties", url: `${APP_URL}/properties` },
        ...(property.location_city
          ? [
              {
                name: property.location_city,
                url: `${APP_URL}/properties?city=${encodeURIComponent(property.location_city)}`,
              },
            ]
          : []),
        { name: property.title, url: canonical },
      ].map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];

  return {
    title,
    description,
    canonical,
    image: property.photos?.[0] || DEFAULT_IMAGE,
    type: "article",
    noindex: property.status !== "live",
    jsonLd,
  };
}

function buildAgencyMeta(agency) {
  const location = agency.location_area || agency.location_city || "";
  const canonical = `${APP_URL}/agencies/${agency.id}`;
  const count = agency.total_listings ?? 0;

  return {
    title: `${agency.display_name}${location ? ` - ${location}` : ""}`,
    description: truncate(
      `${agency.display_name} is a verified real estate agency${location ? ` in ${location}` : ""} ` +
        `with ${count} listing${count === 1 ? "" : "s"} on ${SITE_NAME} - no brokerage.`
    ),
    canonical,
    image: agency.logo_key || DEFAULT_IMAGE,
    type: "website",
    noindex: false,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": canonical,
        name: agency.display_name,
        url: canonical,
        description: truncate(agency.about, 500) || undefined,
        image: agency.logo_key || undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: agency.location_area || agency.location_city || undefined,
          addressRegion: agency.location_city || undefined,
          addressCountry: "IN",
        },
        areaServed: agency.areas_served?.length
          ? agency.areas_served.map((area) => ({ "@type": "Place", name: area }))
          : undefined,
      },
    ],
  };
}

function renderTags(meta) {
  const fullTitle = `${meta.title} | ${SITE_NAME}`;
  const robots = meta.noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1";

  const tags = [
    `<title>${attr(fullTitle)}</title>`,
    `<meta name="description" content="${attr(meta.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${attr(meta.canonical)}" />`,
    `<meta property="og:type" content="${attr(meta.type)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${attr(fullTitle)}" />`,
    `<meta property="og:description" content="${attr(meta.description)}" />`,
    `<meta property="og:image" content="${attr(meta.image)}" />`,
    `<meta property="og:image:alt" content="${attr(meta.title)}" />`,
    `<meta property="og:url" content="${attr(meta.canonical)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(fullTitle)}" />`,
    `<meta name="twitter:description" content="${attr(meta.description)}" />`,
    `<meta name="twitter:image" content="${attr(meta.image)}" />`,
  ];

  for (const block of meta.jsonLd ?? []) {
    tags.push(`<script type="application/ld+json">${jsonLdSafe(block)}</script>`);
  }

  return tags.join("\n    ");
}

/** Swaps the build's placeholder title/description out and appends the real tags. */
function injectIntoHtml(html, meta) {
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/i, "");

  const injected = stripped.replace(/<\/head>/i, `    ${renderTags(meta)}\n  </head>`);
  // If index.html somehow had no </head>, fall back to the untouched document
  // rather than serving a page with no title at all.
  return injected === stripped ? html : injected;
}

export default async function handler(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");

  const indexUrl = new URL("/index.html", url.origin);
  const indexPromise = fetch(indexUrl).then((r) => r.text());

  let meta = null;
  try {
    if (type === "property" && id) {
      const property = await fetchJson(`${apiBase()}/api/properties/${encodeURIComponent(id)}`);
      if (property) meta = buildPropertyMeta(property);
    } else if (type === "agency" && id) {
      const agency = await fetchJson(`${apiBase()}/api/agencies/${encodeURIComponent(id)}`);
      if (agency) meta = buildAgencyMeta(agency);
    }
  } catch {
    meta = null; // API down or slow — still serve the app, just without rich meta
  }

  const html = await indexPromise;
  const body = meta ? injectIntoHtml(html, meta) : html;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Crawlers re-fetch often; cache at the edge so a viral listing doesn't
      // hammer the API, but let it refresh in the background.
      "cache-control": meta
        ? "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
        : "public, max-age=0, s-maxage=30",
      "x-robots-tag": meta?.noindex ? "noindex, nofollow" : "index, follow",
    },
  });
}

export { buildPropertyMeta, buildAgencyMeta, injectIntoHtml, attr, formatPrice };
