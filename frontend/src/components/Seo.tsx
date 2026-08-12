import { createContext, useContext, useEffect, useId, useMemo, useState } from "react";

import { APP_URL, SITE_NAME } from "@/lib/site";

const DEFAULT_DESCRIPTION =
  "Search verified properties for sale, rent, and lease directly from owners and agencies - no brokerage on Letsellr.";
const DEFAULT_IMAGE = `${APP_URL}/og-image.jpg`;

export interface SeoData {
  title: string;
  description?: string;
  image?: string;
  /** Absolute canonical URL for this page; defaults to the current path. */
  url?: string;
  noindex?: boolean;
  /** og:type — "website" for browse/landing pages, "article" for a single listing. */
  type?: "website" | "article";
  /** One or more schema.org objects to emit as JSON-LD <script> tags for rich results. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

interface SeoEntry extends SeoData {
  id: string;
  /** Higher wins. Route defaults are 0; a page with real data is 1. */
  priority: number;
}

interface SeoContextValue {
  publish: (entry: SeoEntry) => void;
  retract: (id: string) => void;
}

const SeoContext = createContext<SeoContextValue | null>(null);

/**
 * Registers this component's metadata and returns nothing.
 *
 * Every caller writes into one shared store which a single renderer reads, so
 * only ever one <title> / description / canonical reaches the document.
 *
 * That indirection is load-bearing on React 19. react-helmet-async v3 delegates
 * to React's native metadata hoisting, and React hoists *every* <title> it is
 * given without deduplicating — so two mounted <Seo> components produced two
 * titles, plus the static one in index.html, and the browser silently used
 * whichever landed first.
 */
function useSeo(data: SeoData | undefined, priority = 1) {
  const ctx = useContext(SeoContext);
  const id = useId();

  // Serialised so a caller passing a fresh object literal every render (the
  // normal case) doesn't re-publish on every render.
  const key = JSON.stringify(data ?? null);

  useEffect(() => {
    if (!ctx) return;
    if (!data) {
      ctx.retract(id);
      return;
    }
    ctx.publish({ ...data, id, priority });
    return () => ctx.retract(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, priority, id, ctx]);
}

/** Back-compat wrapper so pages can keep declaring SEO as JSX. Renders nothing. */
export function Seo(props: SeoData & { priority?: number }) {
  const { priority = 1, ...data } = props;
  useSeo(data, priority);
  return null;
}

function currentPathUrl(): string {
  if (typeof window === "undefined") return APP_URL;
  return `${APP_URL}${window.location.pathname}`;
}

/**
 * Renders the winning entry's tags. React 19 hoists these into <head> itself,
 * so no helmet dependency and no manual DOM mutation is involved.
 */
function SeoTags({ entry }: { entry: SeoEntry | null }) {
  // Strip the placeholder title/description shipped in index.html. React will
  // not remove them (they are not React-owned nodes), so without this they
  // linger alongside the real ones as duplicates.
  useEffect(() => {
    document
      .querySelectorAll("[data-static-seo]")
      .forEach((node) => node.remove());
  }, []);

  if (!entry) return null;

  const {
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    url,
    noindex = false,
    type = "website",
    jsonLd,
  } = entry;

  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = url ?? currentPathUrl();
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
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
      <meta property="og:url" content={canonicalUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />

      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

export function SeoProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<SeoEntry[]>([]);

  const ctx = useMemo<SeoContextValue>(
    () => ({
      publish: (entry) =>
        setEntries((prev) => [...prev.filter((e) => e.id !== entry.id), entry]),
      retract: (id) => setEntries((prev) => prev.filter((e) => e.id !== id)),
    }),
    []
  );

  // Highest priority wins; the most recently published breaks ties, so a page
  // that mounts after the route default takes over cleanly.
  const winner = useMemo(() => {
    if (entries.length === 0) return null;
    return entries.reduce((best, e) => (e.priority >= best.priority ? e : best));
  }, [entries]);

  return (
    <SeoContext.Provider value={ctx}>
      <SeoTags entry={winner} />
      {children}
    </SeoContext.Provider>
  );
}
