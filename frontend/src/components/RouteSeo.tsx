import { useLocation, matchPath } from "react-router-dom";
import { Seo } from "@/components/Seo";

interface RouteSeoEntry {
  /** react-router path pattern, matched in declaration order. */
  path: string;
  title: string;
  description?: string;
  noindex?: boolean;
}

/**
 * Baseline title/description for every route, so the browser tab always
 * reflects the current page instead of the static index.html title.
 *
 * Pages that need data-derived metadata (a property title, an agency name, the
 * active search filters) publish their own, which outranks these on priority.
 * This is what shows while that page's data is still loading.
 */
const ROUTE_SEO: RouteSeoEntry[] = [
  // Public, indexable
  {
    path: "/dashboard",
    title: "Search Properties Direct from Owners",
  },
  // These render the same browse view as /properties and canonicalise to it,
  // so they need a sensible tab title but no special robots handling.
  { path: "/dashboard/search", title: "Search Properties" },
  { path: "/search", title: "Search Properties" },
  { path: "/properties", title: "Browse Verified Properties" },
  { path: "/properties/:propertyId", title: "Property Details" },
  { path: "/agencies/:agencyId", title: "Verified Real Estate Agency" },

  // Auth — real pages users land on, but nothing to index
  {
    path: "/register/type",
    title: "Join Letsellr",
    description: "Create a free Letsellr account as a property seeker, owner, or agency.",
    noindex: true,
  },
  { path: "/register/owner-agency", title: "Register as Owner or Agency", noindex: true },
  { path: "/register/client", title: "Create Your Account", noindex: true },
  { path: "/login", title: "Log In", noindex: true },
  { path: "/verify-otp", title: "Verify Your Number", noindex: true },

  // Owner / agency workspace
  { path: "/owner/dashboard", title: "Owner Dashboard", noindex: true },
  { path: "/owner/properties", title: "My Listings", noindex: true },
  { path: "/owner/properties/new", title: "Add a New Listing", noindex: true },
  { path: "/owner/properties/:propertyId/edit", title: "Edit Listing", noindex: true },
  { path: "/owner/properties/:propertyId", title: "Listing Overview", noindex: true },
  { path: "/owner/settings", title: "Account Settings", noindex: true },

  // Admin platform
  { path: "/admin-platform/login", title: "Admin Login", noindex: true },
  { path: "/admin-platform/dashboard", title: "Admin Dashboard", noindex: true },
  { path: "/admin-platform/properties/add", title: "Admin - Add Property", noindex: true },
  { path: "/admin-platform/properties", title: "Admin - Property Queue", noindex: true },
  { path: "/admin-platform/users", title: "Admin - Users", noindex: true },
  { path: "/admin-platform/reports", title: "Admin - Reports", noindex: true },
  { path: "/admin-platform/categories", title: "Admin - Categories", noindex: true },
  { path: "/admin-platform/locations", title: "Admin - Locations", noindex: true },
  { path: "/admin-platform/landing-page", title: "Admin - Landing Page", noindex: true },
  { path: "/admin-platform/settings", title: "Admin - Settings", noindex: true },
  { path: "/admin-platform/*", title: "Admin Platform", noindex: true },
];

export function RouteSeo() {
  const { pathname } = useLocation();
  const match = ROUTE_SEO.find((entry) => matchPath(entry.path, pathname));

  // priority 0 marks these as fallbacks: any page that publishes its own,
  // data-derived metadata outranks them without a second set of tags being
  // emitted (see the store in Seo.tsx).
  if (!match) {
    return <Seo title="Verified Properties, Direct from Owners" priority={0} />;
  }

  return (
    <Seo
      title={match.title}
      description={match.description}
      noindex={match.noindex}
      priority={0}
    />
  );
}
