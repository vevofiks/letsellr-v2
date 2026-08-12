import { APP_URL } from "@/lib/site";

/** The subset of a property needed to address it. */
export interface Addressable {
  id: string;
  slug?: string | null;
}

/**
 * Path for a listing detail page.
 *
 * Prefers the slug — that is the canonical, indexable URL. Falls back to the
 * id so listings created before the slug backfill (and any response that omits
 * the field) still link somewhere valid; the API resolves both.
 */
export function propertyPath(property: Addressable): string {
  return `/properties/${property.slug || property.id}`;
}

/** Absolute form of {@link propertyPath}, for canonicals, JSON-LD and sitemaps. */
export function propertyUrl(property: Addressable): string {
  return `${APP_URL}${propertyPath(property)}`;
}
