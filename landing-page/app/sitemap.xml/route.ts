import { buildSitemapIndex, xmlResponse, SITE_URL } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();

  const body = buildSitemapIndex([
    { loc: `${SITE_URL}/sitemap-static.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap-properties.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap-locations.xml`, lastmod: now },
  ]);

  return xmlResponse(body);
}
