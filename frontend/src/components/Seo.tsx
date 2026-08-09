import { Helmet } from "react-helmet-async";

const SITE_NAME = "Letsellr";
const DEFAULT_DESCRIPTION =
  "Search verified properties for sale, rent, and lease directly from owners and agencies — no brokerage on Letsellr.";
const DEFAULT_IMAGE = "https://app.letsellr.in/og-image.png";

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  /** Absolute canonical URL for this page; defaults to the current location. */
  url?: string;
  noindex?: boolean;
  /** One or more schema.org objects to emit as JSON-LD <script> tags for rich results. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function Seo({ title, description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE, url, noindex = false, jsonLd }: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = url ?? (typeof window !== "undefined" ? window.location.href : undefined);
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
