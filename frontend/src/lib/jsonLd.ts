import { APP_URL } from "@/components/Seo";

interface PropertyForJsonLd {
  id: string;
  ref: string;
  category: string;
  intent: string;
  title: string;
  description?: string | null;
  price: number;
  price_unit: string;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  photos?: string[];
  location_address?: string | null;
  location_area: string;
  location_city: string;
  location_pincode: string;
  location_state: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const OFFER_AVAILABILITY: Record<string, string> = {
  live: "https://schema.org/InStock",
  rented: "https://schema.org/SoldOut",
  sold: "https://schema.org/SoldOut",
};

/**
 * Builds a schema.org RealEstateListing JSON-LD object for a property detail page.
 * `canonicalUrl` must be the real, absolute URL the page is served at (app.letsellr.in),
 * so the JSON-LD matches the page it's embedded in — mismatched URLs invalidate rich results.
 */
export function buildPropertyJsonLd(property: PropertyForJsonLd, canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || property.title,
    url: canonicalUrl,
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
        ? {
            "@type": "QuantitativeValue",
            value: property.area,
            unitCode: "FTK",
          }
        : undefined,
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "INR",
      availability: OFFER_AVAILABILITY[property.status] || "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };
}

/**
 * ItemList for a browse/search results page. Google uses this to understand a
 * listing page as a collection rather than a wall of undifferentiated text,
 * and it can surface as a carousel for category+city queries.
 */
export function buildItemListJsonLd(
  items: { id: string; title: string }[],
  canonicalUrl: string,
  listName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: canonicalUrl,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: `${APP_URL}/properties/${item.id}`,
    })),
  };
}

interface AgencyForJsonLd {
  id: string;
  display_name: string;
  about?: string | null;
  location_area?: string | null;
  location_city?: string | null;
  areas_served?: string[];
  logo_url?: string | null;
}

/** RealEstateAgent profile for an agency page. */
export function buildAgencyJsonLd(agency: AgencyForJsonLd, canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": canonicalUrl,
    name: agency.display_name,
    url: canonicalUrl,
    description: agency.about || undefined,
    image: agency.logo_url || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: agency.location_area || agency.location_city || undefined,
      addressRegion: agency.location_city || undefined,
      addressCountry: "IN",
    },
    areaServed: agency.areas_served?.length
      ? agency.areas_served.map((area) => ({ "@type": "Place", name: area }))
      : undefined,
    parentOrganization: {
      "@type": "Organization",
      name: "Letsellr",
      url: "https://www.letsellr.in",
    },
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
