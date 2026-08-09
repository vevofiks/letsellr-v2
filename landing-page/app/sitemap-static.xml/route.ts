import { buildUrlset, xmlResponse, getAppUrl, SITE_URL } from "@/lib/sitemap";

export const revalidate = 86400; // 24h — these pages rarely change

export async function GET() {
  const appUrl = getAppUrl();
  const today = new Date().toISOString().split("T")[0];

  const body = buildUrlset([
    { loc: `${SITE_URL}/`, lastmod: today, changefreq: "daily", priority: 1.0 },
    { loc: `${appUrl}/`, lastmod: today, changefreq: "daily", priority: 0.8 },
    { loc: `${appUrl}/search`, lastmod: today, changefreq: "daily", priority: 0.9 },
    { loc: `${appUrl}/properties`, lastmod: today, changefreq: "daily", priority: 0.9 },
  ]);

  return xmlResponse(body);
}
