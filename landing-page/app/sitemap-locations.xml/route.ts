import { buildUrlset, xmlResponse, getApiUrl, getAppUrl, type SitemapUrlEntry } from "@/lib/sitemap";

export const dynamic = "force-dynamic"; // always reflect current locations/categories, never a stale build snapshot

interface PropertyFacet {
  location_city: string | null;
  category: string | null;
  updated_at: string;
}

interface PropertyBrowseResponse {
  results: PropertyFacet[];
}

interface Facet {
  city: string;
  category?: string;
  lastmod?: string;
}

const PAGE_LIMIT = 100;
const MAX_PAGES = 100;

/**
 * Pulls the live listings and derives the city/category facets from them.
 *
 * Deriving beats enumerating configured locations x configured categories:
 * that cross-product emitted ~70 URLs of which only a handful had any listing
 * behind them, so Google spent crawl budget on empty result pages and scored
 * them as soft 404s.
 */
async function fetchLiveFacets(): Promise<PropertyFacet[]> {
  const apiBase = getApiUrl();
  const all: PropertyFacet[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `${apiBase}/api/properties?page=${page}&limit=${PAGE_LIMIT}&sort_by=newest`,
      { cache: "no-store" }
    );
    if (!res.ok) break;

    const data: PropertyBrowseResponse = await res.json();
    const batch = data.results ?? [];
    all.push(...batch);

    if (batch.length < PAGE_LIMIT) break;
  }

  return all;
}

/** Latest updated_at wins, so lastmod tracks the freshest listing in the facet. */
function bump(map: Map<string, Facet>, key: string, facet: Facet, updatedAt?: string) {
  const day = updatedAt?.split("T")[0];
  const existing = map.get(key);
  if (!existing) {
    map.set(key, { ...facet, lastmod: day });
    return;
  }
  if (day && (!existing.lastmod || day > existing.lastmod)) {
    existing.lastmod = day;
  }
}

export async function GET() {
  const appUrl = getAppUrl();

  let properties: PropertyFacet[] = [];
  try {
    properties = await fetchLiveFacets();
  } catch {
    properties = [];
  }

  const cityFacets = new Map<string, Facet>();
  const cityCategoryFacets = new Map<string, Facet>();

  for (const property of properties) {
    const city = property.location_city?.trim();
    if (!city) continue;

    bump(cityFacets, city, { city }, property.updated_at);

    const category = property.category?.trim();
    if (category) {
      // Structured values rather than a parsed composite key, so multi-word
      // cities like "New Delhi" survive the round trip.
      bump(cityCategoryFacets, `${category} ${city}`, { city, category }, property.updated_at);
    }
  }

  const entries: SitemapUrlEntry[] = [];

  for (const { city, lastmod } of cityFacets.values()) {
    entries.push({
      loc: `${appUrl}/properties?city=${encodeURIComponent(city)}`,
      lastmod,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  for (const { city, category, lastmod } of cityCategoryFacets.values()) {
    if (!category) continue;
    // Key order must stay category-then-city to match the canonical the app
    // emits for this page (see the canonical builder in Dashboards.tsx).
    // A different ordering is a different URL to Google.
    entries.push({
      loc: `${appUrl}/properties?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`,
      lastmod,
      changefreq: "weekly",
      priority: 0.5,
    });
  }

  return xmlResponse(buildUrlset(entries));
}
