import { buildUrlset, xmlResponse, getApiUrl, getAppUrl, type SitemapUrlEntry } from "@/lib/sitemap";

export const dynamic = "force-dynamic"; // always reflect current locations/categories, never a stale build snapshot

interface LocationData {
  id: string;
  title: string;
  updated_at: string;
}

interface PropertyType {
  slug: string;
  is_active: boolean;
}

async function fetchLocations(): Promise<LocationData[]> {
  const apiBase = getApiUrl();
  const res = await fetch(`${apiBase}/api/properties/config/locations`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchCategorySlugs(): Promise<string[]> {
  const apiBase = getApiUrl();
  const res = await fetch(`${apiBase}/api/properties/config/types`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const types: PropertyType[] = await res.json();
  return types.map((t) => {
    let slug = t.slug;
    if (slug === "pg_hostel") return "pg";
    if (slug === "flat_appartment" || slug === "flat_apartment") return "apartment";
    return slug;
  });
}

export async function GET() {
  const appUrl = getAppUrl();

  let locations: LocationData[] = [];
  let categorySlugs: string[] = [];
  try {
    [locations, categorySlugs] = await Promise.all([fetchLocations(), fetchCategorySlugs()]);
  } catch {
    locations = [];
    categorySlugs = [];
  }

  const entries: SitemapUrlEntry[] = [];

  for (const location of locations) {
    const city = encodeURIComponent(location.title);
    const lastmod = location.updated_at?.split("T")[0];

    entries.push({
      loc: `${appUrl}/properties?city=${city}`,
      lastmod,
      changefreq: "weekly",
      priority: 0.6,
    });

    for (const category of categorySlugs) {
      entries.push({
        loc: `${appUrl}/properties?city=${city}&category=${category}`,
        lastmod,
        changefreq: "weekly",
        priority: 0.5,
      });
    }
  }

  return xmlResponse(buildUrlset(entries));
}
