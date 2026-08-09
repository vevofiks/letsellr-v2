import { buildUrlset, xmlResponse, getApiUrl, getAppUrl, type SitemapUrlEntry } from "@/lib/sitemap";

export const dynamic = "force-dynamic"; // always reflect current live listings, never a stale build snapshot

interface PropertyListItem {
  id: string;
  updated_at: string;
}

interface PropertyBrowseResponse {
  results: PropertyListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const PAGE_LIMIT = 100;
const MAX_URLS = 50000; // sitemap protocol limit

async function fetchAllLiveProperties(): Promise<PropertyListItem[]> {
  const apiBase = getApiUrl();
  const all: PropertyListItem[] = [];
  let page = 1;

  while (all.length < MAX_URLS) {
    const res = await fetch(
      `${apiBase}/api/properties?page=${page}&limit=${PAGE_LIMIT}&sort_by=newest`,
      { cache: "no-store" }
    );
    if (!res.ok) break;

    const data: PropertyBrowseResponse = await res.json();
    const batch = data.results ?? [];
    all.push(...batch);

    if (batch.length < PAGE_LIMIT) break;
    page += 1;
  }

  return all.slice(0, MAX_URLS);
}

export async function GET() {
  const appUrl = getAppUrl();

  let properties: PropertyListItem[] = [];
  try {
    properties = await fetchAllLiveProperties();
  } catch {
    properties = [];
  }

  const entries: SitemapUrlEntry[] = properties.map((property) => ({
    loc: `${appUrl}/properties/${property.id}`,
    lastmod: property.updated_at?.split("T")[0],
    changefreq: "daily",
    priority: 0.7,
  }));

  return xmlResponse(buildUrlset(entries));
}
