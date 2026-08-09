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
