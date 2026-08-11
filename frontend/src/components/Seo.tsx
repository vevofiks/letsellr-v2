import { Helmet } from "react-helmet-async";

const SITE_NAME = "Letsellr";
export const APP_URL = "https://app.letsellr.in";
const DEFAULT_DESCRIPTION =
  "Search verified properties for sale, rent, and lease directly from owners and agencies - no brokerage on Letsellr.";
const DEFAULT_IMAGE = `${APP_URL}/og-image.jpg`;

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  /** Absolute canonical URL for this page; defaults to the current location. */
  url?: string;
  noindex?: boolean;
  /** og:type — "website" for browse/landing pages, "article" for a single listing. */
  type?: "website" | "article";
  /** One or more schema.org objects to emit as JSON-LD <script> tags for rich results. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Strips query strings and hashes off the current URL so filtered/paginated
 * views don't each self-canonicalise into a separate near-duplicate page.
 */
function currentPathUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${APP_URL}${window.location.pathname}`;
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  noindex = false,
  type = "website",
  jsonLd,
}: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = url ?? currentPathUrl();
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta
        name="robots"
        content={
          noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1"
        }
      />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={title} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
