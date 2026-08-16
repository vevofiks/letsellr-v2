import React, { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";
import { Seo } from "@/components/Seo";
import { APP_URL } from "@/lib/site";
import { buildItemListJsonLd } from "@/lib/jsonLd";
import { propertyPath } from "@/lib/urls";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import {
  Home,
  PlusCircle,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Maximize,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Building2,
  Shield
} from "lucide-react";


// ── Client / Seeker Dashboard ────────────────────────────────────────────────
export const ClientDashboard: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Helper to read initial URL params synchronously before first render
  const getInitialUrlParams = () => {
    if (typeof window === "undefined") return { q: "", type: "", category: "", city: "" };
    const searchParams = new URLSearchParams(window.location.search);
    const q = searchParams.get("search") || searchParams.get("q") || "";
    const type = searchParams.get("type") || searchParams.get("intent") || "";
    const category = searchParams.get("category") || "";
    const city = searchParams.get("city") || searchParams.get("location") || "";
    return { q, type, category, city };
  };

  const initialParams = useMemo(() => getInitialUrlParams(), []);

  const [intent, setIntent] = useState<string>(() => {
    if (initialParams.type && initialParams.type !== "agent" && initialParams.type !== "agencies") {
      return initialParams.type;
    }
    return sessionStorage.getItem("dashboard_intent") || "";
  });
  const [category, setCategory] = useState<string>(() => {
    return initialParams.category || sessionStorage.getItem("dashboard_category") || "";
  });
  const [city, setCity] = useState<string>(() => {
    return initialParams.city || initialParams.q || "";
  });
  const [searchCity, setSearchCity] = useState<string>(() => {
    return initialParams.city || initialParams.q || "";
  });
  const [lat, setLat] = useState<number | null>(() => {
    const saved = localStorage.getItem("user_lat");
    return saved ? parseFloat(saved) : null;
  });
  const [lng, setLng] = useState<number | null>(() => {
    const saved = localStorage.getItem("user_lng");
    return saved ? parseFloat(saved) : null;
  });
  const [gpsActive, setGpsActive] = useState<boolean>(() => {
    return !!(localStorage.getItem("user_lat") && localStorage.getItem("user_lng"));
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [page, setPage] = useState<number>(() => {
    const saved = sessionStorage.getItem("dashboard_page");
    return saved ? parseInt(saved, 10) : 1;
  });

  // Advanced Filter state variables
  const [priceRange, setPriceRange] = useState<string>("all");
  const [genderPreference, setGenderPreference] = useState<string>(() => sessionStorage.getItem("dashboard_genderPreference") || "any");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [radius, setRadius] = useState<number>(20);
  const [limit, setLimit] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return initialParams.q || initialParams.city || sessionStorage.getItem("dashboard_searchQuery") || "";
  });
  const [inputQuery, setInputQuery] = useState<string>(() => {
    return initialParams.q || initialParams.city || sessionStorage.getItem("dashboard_searchQuery") || "";
  });
  const [showDrawerSuggestions, setShowDrawerSuggestions] = useState<boolean>(false);
  const [showTopSuggestions, setShowTopSuggestions] = useState<boolean>(false);
  const [showAdvancedPopover, setShowAdvancedPopover] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "map">(
    () => (localStorage.getItem("dashboard_view_mode") as "list" | "map") || "list"
  );
  const [leftFiltersExpanded, setLeftFiltersExpanded] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [searchMode, setSearchMode] = useState<"properties" | "agencies">(
    () => {
      if (initialParams.type === "agent" || initialParams.type === "agencies") return "agencies";
      return (sessionStorage.getItem("dashboard_searchMode") as "properties" | "agencies") || "properties";
    }
  );
  const [agencies, setAgencies] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const searchModeRef = useRef(searchMode);
  useEffect(() => {
    searchModeRef.current = searchMode;
  }, [searchMode]);

  useEffect(() => {
    api.get("/api/properties/config/types").then((res) => {
      setPropertyTypes(res.data || []);
    }).catch(err => {
      console.error("Failed to fetch property types config:", err);
    });
  }, []);

  // Read initial search params from URL on mount (e.g. from landing page navigation)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const qParam = searchParams.get("search") || searchParams.get("q");
    const typeParam = searchParams.get("type") || searchParams.get("intent");
    const categoryParam = searchParams.get("category");
    const cityParam = searchParams.get("city") || searchParams.get("location");

    if (typeParam) {
      if (typeParam === "agent" || typeParam === "agencies") {
        setSearchMode("agencies");
        sessionStorage.setItem("dashboard_searchMode", "agencies");
      } else {
        setSearchMode("properties");
        setIntent(typeParam);
        sessionStorage.setItem("dashboard_searchMode", "properties");
        sessionStorage.setItem("dashboard_intent", typeParam);
      }
    }

    if (categoryParam) {
      setCategory(categoryParam);
      sessionStorage.setItem("dashboard_category", categoryParam);
    }

    if (cityParam) {
      setCity(cityParam);
      setSearchCity(cityParam);
    }

    if (qParam) {
      setInputQuery(qParam);
      setSearchQuery(qParam);
      sessionStorage.setItem("dashboard_searchQuery", qParam);
    }
  }, []);

  // Persist filters to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("dashboard_intent", intent);
    sessionStorage.setItem("dashboard_category", category);
    sessionStorage.setItem("dashboard_searchMode", searchMode);
    sessionStorage.setItem("dashboard_searchQuery", searchQuery);
    sessionStorage.setItem("dashboard_genderPreference", genderPreference);
  }, [intent, category, searchMode, searchQuery, genderPreference]);

  // Persist current page so it survives navigation away and back
  useEffect(() => {
    sessionStorage.setItem("dashboard_page", String(page));
  }, [page]);

  // Dynamic SEO title/description derived from active search filters
  const { seoTitle, seoDescription, seoCanonical, seoNoindex } = useMemo(() => {
    let title = "Properties";
    let description = "";

    if (searchMode === "agencies") {
      title = "Find Verified Real Estate Agencies";
      if (city) title += ` in ${city}`;
      description = `Browse verified real estate agencies${city ? ` in ${city}` : ""} on Letsellr - no-brokerage listings direct from trusted agencies.`;
    } else {
      const intentLabel = intent === "buy" ? "for Sale" : intent === "rent" ? "for Rent" : intent === "lease" ? "for Lease" : "";
      let categoryLabel = "Properties";

      if (category) {
        const typeObj = propertyTypes.find((t: any) => t.slug === category);
        if (typeObj) {
          categoryLabel = typeObj.label;
        } else {
          categoryLabel = category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        }
      }

      title = `${categoryLabel} ${intentLabel}`.trim();
      if (city) {
        title += ` in ${city}`;
      }
      if (searchQuery && !city) {
        title += ` for "${searchQuery}"`;
      }

      description = `Find ${categoryLabel.toLowerCase()} ${intentLabel}${city ? ` in ${city}` : ""} directly from verified owners and agencies - no brokerage on Letsellr.`;
    }

    if (!title || title === "Properties") {
      title = "Search Properties Direct from Owners";
    }

    // Canonical keeps only the facets worth ranking separately (intent, category,
    // city). Pagination, sort, radius and GPS coords are deliberately dropped —
    // they generate near-infinite duplicate URLs with no unique search intent.
    //
    // Built by hand rather than with URLSearchParams so the key order and the
    // encoding (%20, not +) match sitemap-locations.xml byte for byte. If they
    // diverge, every sitemap URL canonicalises to a different string and Google
    // drops it as "alternate page with proper canonical tag".
    const parts: string[] = [];
    if (intent) parts.push(`intent=${encodeURIComponent(intent)}`);
    if (category) parts.push(`category=${encodeURIComponent(category)}`);
    if (city) parts.push(`city=${encodeURIComponent(city)}`);
    const query = parts.join("&");
    // /dashboard, /dashboard/search, /search and /properties all render this
    // exact component. Pointing them at one canonical path consolidates the
    // ranking signal instead of splitting it four ways over identical content.
    const canonicalUrl = `${APP_URL}/properties${query ? `?${query}` : ""}`;

    return {
      seoTitle: title,
      seoDescription: description || undefined,
      seoCanonical: canonicalUrl,
      // A free-text query produces an unbounded URL space with no standalone
      // search demand — index the facets, not every phrase someone typed.
      seoNoindex: Boolean(searchQuery) && !city && !category,
    };
  }, [intent, category, searchMode, searchQuery, city, propertyTypes]);

  const seoJsonLd = useMemo(() => {
    if (searchMode === "agencies" || !properties.length) return undefined;
    return buildItemListJsonLd(
      properties.map((p) => ({ id: p.id, slug: p.slug, title: p.title })),
      seoCanonical,
      seoTitle
    );
  }, [properties, searchMode, seoCanonical, seoTitle]);

  const popoverRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const drawerSearchRef = useRef<HTMLDivElement>(null);
  const topSearchRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Debounce inputQuery -> searchQuery (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputQuery);
      // Agencies are filtered purely by location, so keep the city filter
      // in sync with whatever the user is typing — otherwise a stale city
      // from an earlier suggestion pick/select would keep overriding new input.
      // Only do this while already in agencies mode (searchModeRef), so simply
      // switching modes with leftover text in the box doesn't force a bogus filter.
      if (searchModeRef.current === "agencies") {
        setCity(inputQuery);
        setSearchCity(inputQuery);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [inputQuery]);

  // Compute suggestions list based on active properties/agencies
  const suggestions = useMemo(() => {
    if (!inputQuery || inputQuery.trim().length < 1) return [];
    const q = inputQuery.toLowerCase().trim();
    const list: Array<{ type: "location" | "title" | "category"; label: string; subtext?: string; categoryValue?: string }> = [];
    const seen = new Set<string>();

    if (searchMode === "agencies") {
      agencies.forEach((agency) => {
        if (agency.location_city && agency.location_city.toLowerCase().includes(q)) {
          const key = `city-${agency.location_city}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ type: "location", label: agency.location_city, subtext: "City" });
          }
        }
        if (agency.location_area && agency.location_area.toLowerCase().includes(q)) {
          const key = `area-${agency.location_area}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ type: "location", label: agency.location_area, subtext: agency.location_city });
          }
        }
      });
    } else {
      const categoriesMap: Record<string, string> = {};
      propertyTypes.forEach(t => {
        categoriesMap[t.slug] = t.label;
      });
      Object.entries(categoriesMap).forEach(([val, label]) => {
        if (label.toLowerCase().includes(q) || val.toLowerCase().includes(q)) {
          const key = `cat-${val}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ type: "category", label: label, categoryValue: val, subtext: "Property Type" });
          }
        }
      });

      properties.forEach((prop) => {
        if (prop.title && prop.title.toLowerCase().includes(q)) {
          const key = `prop-${prop.title}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ type: "title", label: prop.title, subtext: `${prop.location_area || ""}, ${prop.location_city || ""}`.replace(/^, /, "") });
          }
        }
        if (prop.location_city && prop.location_city.toLowerCase().includes(q)) {
          const key = `city-${prop.location_city}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ type: "location", label: prop.location_city, subtext: "City" });
          }
        }
        if (prop.location_area && prop.location_area.toLowerCase().includes(q)) {
          const key = `area-${prop.location_area}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ type: "location", label: prop.location_area, subtext: prop.location_city });
          }
        }
      });
    }
    return list.slice(0, 5);
  }, [inputQuery, searchMode, properties, agencies]);

  const handleSelectSuggestion = (item: { type: string; label: string; categoryValue?: string }) => {
    if (item.type === "category" && item.categoryValue) {
      // Select category type, clear any location/text filter
      setCategory(item.categoryValue);
      setInputQuery(item.label);
      setSearchQuery("");
      setCity("");
      setSearchCity("");
    } else if (item.type === "location") {
      // Select location, clear text query
      setCity(item.label);
      setSearchCity(item.label);
      setInputQuery(item.label);
      setSearchQuery("");
    } else {
      // Free-text (title match)
      setInputQuery(item.label);
      setSearchQuery(item.label);
      setCity("");
      setSearchCity("");
    }
    setShowDrawerSuggestions(false);
    setShowTopSuggestions(false);
    setPage(1);
  };

  const filteredProperties = properties.filter((prop) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (prop.title && prop.title.toLowerCase().includes(query)) ||
      (prop.description && prop.description.toLowerCase().includes(query)) ||
      (prop.location_area && prop.location_area.toLowerCase().includes(query)) ||
      (prop.location_city && prop.location_city.toLowerCase().includes(query))
    );
  });

  const filteredAgencies = agencies.filter((agency) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (agency.location_area && agency.location_area.toLowerCase().includes(query)) ||
      (agency.location_city && agency.location_city.toLowerCase().includes(query))
    );
  });

  // Persist viewMode preference and manage body scroll locking in map mode
  useEffect(() => {
    localStorage.setItem("dashboard_view_mode", viewMode);
    if (viewMode === "map") {
      const origOverflow = document.body.style.overflow;
      const origHeight = document.body.style.height;
      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.height = origHeight;
      };
    }
  }, [viewMode]);

  // Close popovers and search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(event.target as Node)
      ) {
        setShowAdvancedPopover(false);
      }
      if (drawerSearchRef.current && !drawerSearchRef.current.contains(event.target as Node)) {
        setShowDrawerSuggestions(false);
      }
      if (topSearchRef.current && !topSearchRef.current.contains(event.target as Node)) {
        setShowTopSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect admins to their dashboard; owner/agency can browse the seeker search page too
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  // Fallback images for premium property categories
  const getCategoryFallbackImage = (cat: string) => {
    switch (cat) {
      case "apartment":
        return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
      case "villa_house":
        return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80";
      case "land":
        return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
      case "commercial":
        return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80";
      case "pg":
      case "hostel":
        return "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
      default:
        return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
    }
  };

  const formatPrice = (price: number, unit: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
    return unit === "per_month" ? `${formatted}/mo` : formatted;
  };

  // Map Mode Initialization Effect
  useEffect(() => {
    if (viewMode !== "map" || !mapRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    // Fix default icons path
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 5,
      maxZoom: 13,
      worldCopyJump: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 5,
      maxZoom: 13,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Force map to re-evaluate dimensions to fill container completely
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode]);

  // Recalculate map size whenever drawer opens/closes or layout shifts
  useEffect(() => {
    if (mapInstanceRef.current && viewMode === "map") {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [drawerOpen, viewMode]);

  // Sync Markers when filtered properties or map updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || viewMode !== "map") return;

    // Helper for creating custom circular pin marker
    const createCustomIcon = (prop: any) => {
      const photoUrl = prop.photos && prop.photos.length > 0
        ? prop.photos[0]
        : getCategoryFallbackImage(prop.category);

      return L.divIcon({
        html: `
          <div class="custom-map-pin flex flex-col items-center justify-center" style="position: relative; width: 44px; height: 50px;">
            <div style="
              width: 38px; 
              height: 38px; 
              border-radius: 50%; 
              border: 3px solid #23D283; 
              background-color: white; 
              box-shadow: 0 4px 8px rgba(0,0,0,0.25); 
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              position: absolute;
              top: 0;
              left: 3px;
              z-index: 2;
            ">
              <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="
              width: 8px;
              height: 8px;
              background-color: #23D283;
              border-radius: 50%;
              border: 1.5px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              position: absolute;
              bottom: 2px;
              left: 18px;
              z-index: 1;
            "></div>
          </div>
        `,
        className: 'custom-pin-container',
        iconSize: [44, 50],
        iconAnchor: [22, 48],
        popupAnchor: [0, -44]
      });
    };

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validProps = filteredProperties.filter(
      (p) => p.latitude !== null && p.longitude !== null
    );

    if (validProps.length === 0) {
      if (lat !== null && lng !== null) {
        map.setView([lat, lng], 13);
      } else {
        map.setView([20.5937, 78.9629], 5); // Fallback center
      }
      return;
    }

    const bounds = L.latLngBounds([]);

    validProps.forEach((prop) => {
      const marker = L.marker([prop.latitude, prop.longitude], {
        icon: createCustomIcon(prop)
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 2px; max-width: 200px;">
            <img src="${prop.photos && prop.photos.length > 0 ? prop.photos[0] : getCategoryFallbackImage(prop.category)}" style="width: 100%; height: 80px; border-radius: 8px; object-fit: cover; margin-bottom: 6px;" />
            <strong style="color: #0B6E4F; font-size: 12px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prop.title}</strong>
            <span style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">${prop.category.replace("_", " ")}</span>
            <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 4px;">${formatPrice(prop.price, prop.price_unit)}</div>
            <a href="/properties/${prop.id}" style="display: inline-block; font-size: 10px; color: #0B6E4F; font-weight: 700; text-decoration: none; margin-top: 6px;">VIEW DETAILS →</a>
          </div>
        `);

      markersRef.current.push(marker);
      bounds.extend([prop.latitude, prop.longitude]);
    });

    if (validProps.length > 0) {
      map.fitBounds(bounds, { maxZoom: 13, padding: [40, 40] });
    }
  }, [filteredProperties, viewMode, lat, lng]);

  // Fetch properties or agencies from backend
  const fetchData = async () => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      if (searchMode === "agencies") {
        const params: any = {
          page,
        };
        if (city) params.city = city;

        const res = await api.get("/api/agencies", { params });
        const newItems = res.data.results || res.data || [];

        if (page === 1 || viewMode === "list") {
          setAgencies(newItems);
        } else {
          setAgencies((prev) => {
            const existingIds = new Set(prev.map(a => a.id));
            const filteredNew = newItems.filter((a: any) => !existingIds.has(a.id));
            return [...prev, ...filteredNew];
          });
        }

        if (newItems.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        const params: any = {
          page,
          limit,
        };
        if (intent) params.intent = intent;
        if (category) {
          if (category === "apartment" || category === "flat_apartment") {
            params.category = "apartment,flat_apartment";
          } else {
            params.category = category;
          }
        }
        if (city && !gpsActive) params.city = city;
        if (searchQuery && !gpsActive) params.q = searchQuery;
        if (genderPreference && genderPreference !== "any") {
          params.gender_preference = genderPreference;
        }

        // Map price range dropdown value to min_price and max_price API parameters
        if (priceRange === "under-50k") {
          params.max_price = 50000;
        } else if (priceRange === "50k-5l") {
          params.min_price = 50000;
          params.max_price = 500000;
        } else if (priceRange === "5l-15l") {
          params.min_price = 500000;
          params.max_price = 1500000;
        } else if (priceRange === "15l-50l") {
          params.min_price = 1500000;
          params.max_price = 5000000;
        } else if (priceRange === "50l-1cr") {
          params.min_price = 5000000;
          params.max_price = 10000000;
        } else if (priceRange === "above-1cr") {
          params.min_price = 10000000;
        }

        if (sortBy) params.sort_by = sortBy;
        if (lat !== null && lng !== null) {
          params.lat = lat;
          params.lng = lng;
          params.radius = radius;
        }

        const res = await api.get("/api/properties", { params });
        const newItems = res.data.results || res.data || [];

        if (page === 1 || viewMode === "list") {
          setProperties(newItems);
        } else {
          setProperties((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const filteredNew = newItems.filter((p: any) => !existingIds.has(p.id));
            return [...prev, ...filteredNew];
          });
        }

        const newTotal = res.data.total ?? newItems.length;
        const newTotalPages = res.data.total_pages ?? (newItems.length < limit ? page : page + 1);
        setTotalPages(newTotalPages);

        if (newItems.length < limit || page >= newTotalPages) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch listings", err);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchMode, intent, category, city, searchQuery, lat, lng, gpsActive, page, priceRange, sortBy, radius, limit, genderPreference]);

  const handleDrawerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      if (!loading && !loadingMore && hasMore) {
        setPage((prev) => prev + 1);
      }
    }
  };

  // Geolocation trigger
  const toggleGPS = () => {
    if (gpsActive) {
      setGpsActive(false);
      setLat(null);
      setLng(null);
      localStorage.removeItem("user_lat");
      localStorage.removeItem("user_lng");
      setDetectedLocation("");
      if (searchCity === "My Location") {
        setSearchCity("");
        setCity("");
      }
      setPage(1);
      toast.success("Nearby GPS filter disabled");
      return;
    }

    setGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        localStorage.setItem("user_lat", latitude.toString());
        localStorage.setItem("user_lng", longitude.toString());
        setGpsActive(true);
        setGpsLoading(false);
        setPage(1);
        toast.success("Location retrieved! Searching within 20km.");

        // Resolve city and state from coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();
          const cityVal =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          const stateVal = data.address?.state || "";

          const resolvedLocation = cityVal || stateVal || "My Location";
          if (cityVal && stateVal) {
            setDetectedLocation(`${cityVal}, ${stateVal}`);
          } else {
            setDetectedLocation(resolvedLocation);
          }
          setSearchCity(resolvedLocation);
          setCity(resolvedLocation);
        } catch (err) {
          console.error("Failed to reverse geocode GPS location:", err);
          setSearchCity("My Location");
          setCity("My Location");
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location access denied. Please enable location permissions.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location retrieval timed out. Defaulting to standard search.");
        } else {
          toast.error("Failed to retrieve location: " + error.message);
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCity(searchCity);
    setPage(1);
  };

  const handleResetAll = () => {
    setIntent("");
    setCategory("");
    setCity("");
    setSearchCity("");
    setPriceRange("all");
    setGenderPreference("any");
    setSortBy("newest");
    setRadius(20);
    setLimit(12);
    setLat(null);
    setLng(null);
    setGpsActive(false);
    setSearchQuery("");
    setInputQuery("");
    setPage(1);
    toast.success("Filters reset successfully");
  };



  const handleOpenDetails = (prop: any) => {
    navigate(propertyPath(prop));
  };

  const SkeletonCard = () => (
    <Card className="border-slate-100 bg-white overflow-hidden animate-pulse rounded-xl p-4">
      <div className="h-48 w-full bg-slate-200 rounded-lg" />
      <CardHeader className="space-y-3 pb-3 px-0">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-slate-200 rounded-full" />
          <div className="h-5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        <div className="flex gap-4">
          <div className="h-4 w-12 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-full bg-slate-200 rounded-lg" />
      </CardContent>
    </Card>
  );

  // console.log(category)

  return (
    <div className={cn(
      "bg-[#f4f6f5] text-left relative font-sans",
      viewMode === "map" ? "fixed inset-0 h-[100dvh] w-full flex flex-col overflow-hidden z-30" : "min-h-screen"
    )}>
      <Seo
        title={seoTitle}
        description={seoDescription}
        url={seoCanonical}
        noindex={seoNoindex}
        jsonLd={seoJsonLd}
      />

      <AppNavbar logoHref="/dashboard" />

      {viewMode === "map" ? (
        /* Immersive Map mode */
        <div className="flex-1 w-full relative overflow-hidden flex z-10">
          {/* Background Map */}
          <div
            ref={mapRef}
            className="absolute inset-0 w-full h-full z-0 bg-[#aad3df] [&_.leaflet-container]:!bg-[#aad3df]"
          />

          {/* Floating Listings side drawer */}
          <div
            className={cn(
              "absolute top-0 left-0 h-full w-95 sm:w-110 max-w-[85vw] bg-white/95 backdrop-blur-md shadow-2xl border-r border-slate-200/80 z-20 transition-transform duration-300 ease-in-out flex flex-col",
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Sliding Toggle handle button on the right edge of drawer */}
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="absolute top-1/2 -translate-y-1/2 -right-6 z-30 flex items-center justify-center w-6 h-16 bg-white hover:bg-slate-50 border-y border-r border-slate-200 rounded-r-xl shadow-md cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
            >
              {drawerOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {/* Listings Sidebar Content Pane */}
            <div className="flex-1 flex flex-col min-h-0 bg-white">

              {/* Drawer Header with Title, Result count & inline Filters toggle */}
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900 m-0">
                    {searchMode === "agencies" ? "Agencies Search" : "Properties Search"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setLeftFiltersExpanded(!leftFiltersExpanded)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm cursor-pointer transition-all",
                      leftFiltersExpanded
                        ? "bg-brand-green border-brand-green text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>{leftFiltersExpanded ? "Hide Filters" : "Filters"}</span>
                  </button>
                </div>

                {/* Instant Search input for name & location with suggestions */}
                <div ref={drawerSearchRef} className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
                  <input
                    type="text"
                    placeholder={searchMode === "agencies" ? "Search by city or area..." : "Search name, area, or city..."}
                    value={inputQuery}
                    onFocus={() => setShowDrawerSuggestions(true)}
                    onChange={(e) => {
                      setInputQuery(e.target.value);
                      setShowDrawerSuggestions(true);
                    }}
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                  />
                  {inputQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputQuery("");
                        setSearchQuery("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer z-10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Autocomplete Suggestions Dropdown */}
                  {showDrawerSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                        <span>Suggestions</span>
                        <button type="button" onClick={() => setShowDrawerSuggestions(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden divide-y divide-slate-50 py-1">
                        {suggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            className="w-full px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn(
                                "p-1 rounded-md shrink-0",
                                item.type === "location" ? "bg-brand-green/10 text-brand-green" :
                                  item.type === "category" ? "bg-emerald-50 text-emerald-600" :
                                    "bg-blue-50 text-blue-600"
                              )}>
                                {item.type === "location" ? <MapPin className="h-3 w-3" /> :
                                  item.type === "category" ? <Home className="h-3 w-3" /> :
                                    searchMode === "agencies" ? <Building2 className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate m-0">{item.label}</p>
                                {item.subtext && <p className="text-[9px] text-slate-400 font-normal truncate m-0">{item.subtext}</p>}
                              </div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                              {item.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Showing {searchMode === "agencies" ? filteredAgencies.length : filteredProperties.length} results
                </div>

                {/* Collapsible Left Filters */}
                {leftFiltersExpanded && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-3 mt-1 shadow-inner">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Looking For */}
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Looking For</span>
                        <Select
                          value={category || undefined}
                          onValueChange={(val) => {
                            setCategory(val === "all" || !val ? "" : val);
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-md h-8 px-2 font-semibold text-slate-800 text-[10px]">
                            <SelectValue placeholder="Property Type">
                              {category ? propertyTypes.find((t: any) => t.slug === category)?.label || category : "All Types"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-50">
                            <SelectItem value="all">All Types</SelectItem>
                            {propertyTypes.map((t: any) => (
                              console.log(t.slug,"console slugs"),
                              <SelectItem key={t.slug} value={t.slug}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Gender Preference (PG/Hostel only) */}
                      {["pg", "hostel", "pg_hostel"].includes(category) && (
                        <div className="flex flex-col gap-1 text-left col-span-2 mt-1">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Gender Pref.</span>
                          <div className="flex bg-slate-200/50 p-0.5 rounded-md w-full">
                            <button type="button" onClick={() => { setGenderPreference("any"); setPage(1); }} className={cn("flex-1 text-[10px] font-bold py-1 rounded-sm transition-colors", genderPreference === "any" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>All</button>
                            <button type="button" onClick={() => { setGenderPreference("men"); setPage(1); }} className={cn("flex-1 text-[10px] font-bold py-1 rounded-sm transition-colors", genderPreference === "men" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>Mens</button>
                            <button type="button" onClick={() => { setGenderPreference("ladies"); setPage(1); }} className={cn("flex-1 text-[10px] font-bold py-1 rounded-sm transition-colors", genderPreference === "ladies" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>Ladies</button>
                          </div>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex flex-col gap-1 text-left col-span-2">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Budget</span>
                        <Select
                          value={priceRange === "all" ? undefined : priceRange}
                          onValueChange={(val) => {
                            setPriceRange(val || "all");
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-md h-8 px-2 font-semibold text-slate-800 text-[10px]">
                            <SelectValue placeholder="Any Price">
                              {priceRange === "under-50k" ? "Under ₹50k" : priceRange === "50k-5l" ? "₹50k - ₹5L" : priceRange === "5l-15l" ? "₹5L - ₹15L" : priceRange === "15l-50l" ? "₹15L - ₹50L" : priceRange === "50l-1cr" ? "₹50L - ₹1Cr" : priceRange === "above-1cr" ? "Above ₹1Cr" : "Any Price"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-50">
                            <SelectItem value="all">Any Price</SelectItem>
                            <SelectItem value="under-50k">Under ₹50k</SelectItem>
                            <SelectItem value="50k-5l">₹50k - ₹5L</SelectItem>
                            <SelectItem value="5l-15l">₹5L - ₹15L</SelectItem>
                            <SelectItem value="15l-50l">₹15L - ₹50L</SelectItem>
                            <SelectItem value="50l-1cr">₹50L - ₹1Cr</SelectItem>
                            <SelectItem value="above-1cr">Above ₹1Cr</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location City text input */}
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">City</span>
                        <div className={cn(
                          "flex items-center gap-1 bg-white border rounded-md h-8 px-2 shadow-sm transition-all",
                          "border-slate-200 hover:border-slate-300"
                        )}>
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="City..."
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            onBlur={() => {
                              setCity(searchCity);
                              setPage(1);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                setCity(searchCity);
                                setPage(1);
                              }
                            }}
                            className={cn(
                              "w-full bg-transparent border-0 font-semibold text-slate-800 text-[10px] focus:outline-none focus:ring-0 p-0",
                              "placeholder:text-slate-400"
                            )}
                          />
                        </div>
                      </div>

                      {/* GPS toggle button */}
                      <div className="flex flex-col gap-1 justify-end text-left">
                        <button
                          type="button"
                          onClick={toggleGPS}
                          disabled={gpsLoading}
                          className={`flex items-center justify-center gap-1.5 px-3 h-8 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${gpsActive
                            ? "border-emerald-500 text-emerald-700 bg-emerald-50/50"
                            : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                            }`}
                        >
                          {gpsLoading ? (
                            <span className="h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <MapPin className={`h-3 w-3 ${gpsActive ? "text-emerald-600 animate-bounce" : "text-slate-400"}`} />
                              {gpsActive ? `Nearby Active` : "GPS Nearby"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Slider for GPS Search Radius */}
                    {gpsActive && (
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Search Radius</span>
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.2 rounded">{radius} km</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="50"
                          value={radius}
                          onChange={(e) => {
                            setRadius(Number(e.target.value));
                            setPage(1);
                          }}
                          className="w-full accent-brand-green h-1 bg-slate-200 rounded-lg cursor-pointer appearance-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Scrollable Listings Column inside Drawer */}
              <div
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-none"
                onScroll={handleDrawerScroll}
              >
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="border border-slate-100 bg-white rounded-2xl p-3 flex flex-row gap-3 animate-pulse">
                      <div className="h-24 w-24 rounded-xl bg-slate-200 shrink-0" />
                      <div className="flex-1 flex flex-col justify-between py-0.5 space-y-2">
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-12 bg-slate-200 rounded" />
                          <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
                          <div className="h-2.5 w-1/2 bg-slate-200 rounded" />
                        </div>
                        <div className="h-5 w-20 bg-slate-200 rounded" />
                      </div>
                    </div>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                    <Home className="h-8 w-8 text-brand-green mb-2 opacity-60" />
                    <p className="text-xs font-semibold text-slate-500 m-0">No properties matched filters.</p>
                  </div>
                ) : (
                  <>
                    {filteredProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="relative border border-slate-200/80 bg-white hover:shadow-md transition-all duration-200 overflow-hidden flex flex-row p-3 rounded-lg gap-4 text-left shrink-0 cursor-pointer group animate-in fade-in"
                      >
                        {/* Image Thumbnail */}
                        <div className="h-26 w-26 sm:h-28 sm:w-28 rounded-lg overflow-hidden relative shrink-0">
                          <img
                            src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : getCategoryFallbackImage(prop.category)}
                            alt={prop.title}

                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-1.5 left-1.5 flex flex-col">
                            <span className="inline-flex rounded-[8px] bg-brand-green px-2 py-[0.5px] text-[8px] text-center font-semibold text-white shadow-sm uppercase tracking-wider">
                              For {prop.intent === "buy" ? "Sale" : prop.intent === "rent" ? "Rent" : "Lease"}
                            </span>
                          </div>
                        </div>

                        {/* Card Info Right */}
                        <div className="flex-1 flex flex-col justify-between py-0.5 text-left min-w-0">
                          <div className="space-y-1 min-w-0">
                            {/* Location line + Category badge */}
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 min-w-0">
                                <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                                <span className="truncate">{prop.location_area || prop.location_city}</span>
                              </div>

                              <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold text-slate-700 shrink-0 gap-1 shadow-2xs">
                                <Home className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                                <span className="capitalize whitespace-nowrap">{prop.category.replace("_", " ")}</span>
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1 hover:text-brand-green transition-colors leading-tight m-0">
                              {prop.title}
                            </h3>

                            {/* Full Address */}
                            <p className="text-[9px] text-slate-400 font-medium truncate leading-none m-0">
                              {prop.location_address}
                            </p>

                            {/* Specs Row */}
                            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] text-slate-500 font-bold pt-1 flex-wrap">
                              <span className="flex items-center gap-0.5 whitespace-nowrap shrink-0">
                                <Bed className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {prop.bedrooms || 0} Bed
                              </span>
                              <span className="text-slate-300 font-normal">•</span>
                              <span className="flex items-center gap-0.5 whitespace-nowrap shrink-0">
                                <Bath className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {prop.bathrooms || 0} Bath
                              </span>
                              <span className="text-slate-300 font-normal">•</span>
                              <span className="flex items-center gap-0.5 whitespace-nowrap shrink-0">
                                <Maximize className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {prop.area && Number(prop.area) > 0 ? `${prop.area} SQFT` : "Not Specified"}
                              </span>
                            </div>
                          </div>

                          {/* Price Row */}
                          <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-slate-100/60 mt-1 gap-1.5">
                            <span className="font-extrabold text-[12px] sm:text-[13px] text-slate-900 flex items-baseline gap-0.5 truncate min-w-0">
                              <span className="truncate">{formatPrice(prop.price, prop.price_unit)}</span>
                              {prop.intent === "rent" && <span className="text-[9px] font-medium text-slate-400 shrink-0">/ month</span>}
                            </span>

                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 text-[8px] font-black text-emerald-700 uppercase tracking-wider">
                              <Shield className="h-2.5 w-2.5" /> Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {loadingMore && (
                      <div className="flex justify-center py-2 shrink-0">
                        <div className="h-4 w-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Floating Switch Back button (Map / List view toggle button floats on the bottom-right of the map) */}
          <div className="absolute bottom-5 right-5 z-20 flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-brand-green animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Container */
        <main className="mx-auto max-w-9xl px-5 py-2 pb-5 sm:pb-5">

          {/* Full-width Hero Banner Section */}
          {/* <div 
          className="relative overflow-hidden -mx-5 md:mx-0 rounded-none md:rounded-[32px] text-white py-12 md:py-20 px-4 md:px-16 shadow-lg bg-cover bg-center mb-8 flex flex-col items-center justify-center min-h-60 md:min-h-95"
          style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.85)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')` }}
        >
          <div className="relative z-10 text-center max-w-full md:max-w-3xl space-y-3 px-4 flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-[10px] sm:text-xs font-bold text-brand-green border border-white/10 uppercase tracking-normal md:tracking-widest whitespace-nowrap">
              <span className="hidden sm:inline">Your Reliable Ally in Worldwide Real Estate</span>
              <span className="inline sm:hidden">Worldwide Real Estate</span>
            </span>
            <h1 className="text-xl sm:text-4xl md:text-6xl font-black tracking-tight text-white m-0 leading-tight whitespace-nowrap">
              Choose Your Next Home
            </h1>
          </div>
        </div> */}

          {/* Custom Search Filter Bar from Reference UI */}
          <div className="w-full relative z-20 mt-4 pb-4 border-b border-slate-200">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="flex flex-col lg:flex-row lg:items-end gap-3 w-full justify-between">

                {/* Looking For Dropdown - Hidden on mobile, shown on lg screens */}
                <div className={cn("hidden lg:flex flex-col text-left min-w-35 flex-1", searchMode === "agencies" && "opacity-30 pointer-events-none select-none relative")}>
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5 ml-0.5">Looking For</label>
                  <Select
                    value={category || undefined}
                    onValueChange={(val) => {
                      setCategory(val === "all" || !val ? "" : val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className={cn(
                      "w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg h-10 px-3 font-semibold text-slate-800 text-[13px] shadow-sm cursor-pointer transition-all",
                      "focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    )}>
                      <SelectValue placeholder="Property Type">
                        {category ? propertyTypes.find((t: any) => t.slug === category)?.label || category : "All Types"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 shadow-md rounded-lg p-1 z-30">
                      <SelectItem value="all">All Types</SelectItem>
                      {propertyTypes.map((t: any) => (
                        <SelectItem key={t.slug} value={t.slug}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>



                {/* Price Dropdown - Hidden on mobile, shown on lg screens */}
                <div className={cn("hidden lg:flex flex-col text-left min-w-35 flex-1", searchMode === "agencies" && "opacity-30 pointer-events-none select-none relative")}>
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5 ml-0.5">Price</label>
                  <Select
                    value={priceRange === "all" ? undefined : priceRange}
                    onValueChange={(val) => {
                      setPriceRange(val || "all");
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className={cn(
                      "w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg h-10 px-3 font-semibold text-slate-800 text-[13px] shadow-sm cursor-pointer transition-all",
                      "focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    )}>
                      <SelectValue placeholder="Any Price">
                        {priceRange === "under-50k" ? "Under ₹50k" : priceRange === "50k-5l" ? "₹50k - ₹5L" : priceRange === "5l-15l" ? "₹5L - ₹15L" : priceRange === "15l-50l" ? "₹15L - ₹50L" : priceRange === "50l-1cr" ? "₹50L - ₹1Cr" : priceRange === "above-1cr" ? "Above ₹1Cr" : "Any Price"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 shadow-md rounded-lg p-1 z-30">
                      <SelectItem value="all">Any Price</SelectItem>
                      <SelectItem value="under-50k">Under ₹50k</SelectItem>
                      <SelectItem value="50k-5l">₹50k - ₹5L</SelectItem>
                      <SelectItem value="5l-15l">₹5L - ₹15L</SelectItem>
                      <SelectItem value="15l-50l">₹15L - ₹50L</SelectItem>
                      <SelectItem value="50l-1cr">₹50L - ₹1Cr</SelectItem>
                      <SelectItem value="above-1cr">Above ₹1Cr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              
                {/* Location Input - Hidden on mobile, shown on lg screens */}
                <div className="hidden lg:flex flex-col text-left min-w-42.5 flex-1">
                  <label className="text-[13px] font-semibold text-slate-700 mb-1.5 ml-0.5">Location</label>
                  <div className={cn(
                    "flex items-center gap-1.5 bg-white border rounded-lg h-10 px-3 transition-all shadow-sm",
                    gpsActive ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200 hover:border-slate-300",
                    "focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green"
                  )}>
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="City..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      onBlur={() => {
                        setCity(searchCity);
                        setPage(1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setCity(searchCity);
                          setPage(1);
                        }
                      }}
                      className={cn(
                        "w-full bg-transparent border-0 font-semibold text-slate-800 text-[13px] focus:outline-none focus:ring-0 p-0",
                        "placeholder:text-slate-400"
                      )}
                    />
                  </div>
                </div>

                {/* Combined search & filter button layout for horizontal row on mobile */}
                <div className="flex items-end gap-3 flex-1 min-w-0 w-full lg:contents">
                  {/* Find Specific Property Input */}
                  <div ref={topSearchRef} className="flex-1 min-w-0 lg:min-w-35 flex flex-col text-left relative">
                    <div className={cn(
                      "flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg h-10 px-3 transition-all shadow-sm relative",
                      "focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green"
                    )}>
                      <input
                        type="text"
                        placeholder={searchMode === "agencies" ? "Ex. city or area" : "Ex. villa, apartment..."}
                        value={inputQuery}
                        onFocus={() => setShowTopSuggestions(true)}
                        onChange={(e) => {
                          setInputQuery(e.target.value);
                          setShowTopSuggestions(true);
                        }}
                        className={cn(
                          "w-full bg-transparent border-0 font-semibold text-slate-800 text-[13px] focus:outline-none focus:ring-0 p-0",
                          "placeholder:text-slate-400"
                        )}
                      />
                      {inputQuery ? (
                        <X
                          className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                          onClick={() => {
                            setInputQuery("");
                            setSearchQuery("");
                          }}
                        />
                      ) : (
                        <Search className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {showTopSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <span>Suggestions</span>
                          <button type="button" onClick={() => setShowTopSuggestions(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden divide-y divide-slate-50 py-1">
                          {suggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectSuggestion(item)}
                              className="w-full px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={cn(
                                  "p-1 rounded-md shrink-0",
                                  item.type === "location" ? "bg-brand-green/10 text-brand-green" :
                                    item.type === "category" ? "bg-emerald-50 text-emerald-600" :
                                      "bg-blue-50 text-blue-600"
                                )}>
                                  {item.type === "location" ? <MapPin className="h-3 w-3" /> :
                                    item.type === "category" ? <Home className="h-3 w-3" /> :
                                      searchMode === "agencies" ? <Building2 className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 truncate m-0">{item.label}</p>
                                  {item.subtext && <p className="text-[9px] text-slate-400 font-normal truncate m-0">{item.subtext}</p>}
                                </div>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                                {item.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filter Button with Absolute Popover */}
                  <div className="relative flex flex-col text-left justify-end shrink-0">
                    <button
                      ref={filterBtnRef}
                      type="button"
                      onClick={() => setShowAdvancedPopover(!showAdvancedPopover)}
                      className={`flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm ${showAdvancedPopover
                        ? "bg-slate-100 border-slate-300 text-slate-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <SlidersHorizontal className="h-4 w-4 shrink-0" />
                      <span>Filter</span>
                    </button>

                    {/* Popover — bottom sheet on mobile, dropdown on desktop */}
                    {showAdvancedPopover && (
                      <>
                        {/* Mobile backdrop */}
                        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setShowAdvancedPopover(false)} />
                        <div
                          ref={popoverRef}
                          className={cn(
                            "z-50 bg-white border border-slate-200 shadow-xl",
                            // Mobile: full-width bottom sheet
                            "fixed bottom-0 left-0 right-0 rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200",
                            // Desktop: dropdown
                            "lg:absolute lg:fixed-[unset] lg:bottom-auto lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:w-72 lg:rounded-lg lg:max-h-none lg:overflow-visible lg:slide-in-from-bottom-0 lg:slide-in-from-top-2"
                          )}
                        >
                          {/* Handle bar — mobile only */}
                          <div className="flex justify-center mb-3 lg:hidden">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                                Filters
                                {gpsActive && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
                              </span>
                              <div className="flex items-center gap-2">
                                {(intent || category || city || priceRange !== "all" || gpsActive || limit !== 12) && (
                                  <button
                                    type="button"
                                    onClick={() => { handleResetAll(); setShowAdvancedPopover(false); }}
                                    className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 px-2 py-0.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                  >
                                    Reset All
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowAdvancedPopover(false)}
                                  className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Search Mode Selector */}
                            <div className="flex flex-col gap-1 pb-2 border-b border-slate-100">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Search For</span>
                              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => { setSearchMode("properties"); setPage(1); }}
                                  className={cn(
                                    "py-1 text-xs font-extrabold rounded-md transition-all cursor-pointer",
                                    searchMode === "properties"
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "text-slate-500 hover:text-slate-700"
                                  )}
                                >
                                  Properties
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setSearchMode("agencies"); setPage(1); setViewMode("list"); }}
                                  className={cn(
                                    "py-1 text-xs font-extrabold rounded-md transition-all cursor-pointer",
                                    searchMode === "agencies"
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "text-slate-500 hover:text-slate-700"
                                  )}
                                >
                                  Agencies
                                </button>
                              </div>
                            </div>

                            {/* Mobile-only: Looking For + Type in 2-col grid */}
                            <div className={cn("grid grid-cols-2 gap-2 lg:hidden", searchMode === "agencies" && "opacity-30 pointer-events-none select-none relative")}>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Intent</span>
                                <Select value={intent || undefined} onValueChange={(val) => { setIntent(val === "all" || !val ? "" : val); setPage(1); }}>
                                  <SelectTrigger className="w-full bg-white border border-slate-200 rounded-md h-8 px-2 font-semibold text-slate-800 text-[11px]">
                                    <SelectValue placeholder="Any">{intent === "buy" ? "Sale" : intent === "rent" ? "Rent" : intent === "lease" ? "Lease" : "Any"}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-60">
                                    <SelectItem value="all">Any</SelectItem>
                                    <SelectItem value="buy">For Sale</SelectItem>
                                    <SelectItem value="rent">For Rent</SelectItem>
                                    <SelectItem value="lease">For Lease</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Type</span>
                                <Select value={category || undefined} onValueChange={(val) => { setCategory(val === "all" || !val ? "" : val); setPage(1); }}>
                                  <SelectTrigger className="w-full bg-white border border-slate-200 rounded-md h-8 px-2 font-semibold text-slate-800 text-[11px]">
                                    <SelectValue placeholder="All Types">
                                      {category ? (propertyTypes.find(t => t.slug === category)?.label || category.replace("_", " ")) : "All Types"}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-60">
                                    <SelectItem value="all">All Types</SelectItem>
                                    {propertyTypes.map((t: any) => (
                                      <SelectItem key={t.slug} value={t.slug}>{t.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Gender / Tenant Preference */}
                            {category && ["pg", "hostel", "pg_hostel", "villa_house", "apartment"].includes(category) && (
                              <div className="flex flex-col gap-1 lg:hidden">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                  {["pg", "hostel", "pg_hostel"].includes(category) ? "Gender Preference" : "Tenant Preference"}
                                </span>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg w-full flex-wrap">
                                  <button type="button" onClick={() => { setGenderPreference("any"); setPage(1); }} className={cn("flex-1 text-xs font-bold py-1.5 px-2 rounded-md transition-colors whitespace-nowrap", genderPreference === "any" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>All</button>
                                  {["pg", "hostel", "pg_hostel"].includes(category) ? (
                                    <>
                                      <button type="button" onClick={() => { setGenderPreference("men"); setPage(1); }} className={cn("flex-1 text-xs font-bold py-1.5 px-2 rounded-md transition-colors whitespace-nowrap", genderPreference === "men" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>Men</button>
                                      <button type="button" onClick={() => { setGenderPreference("ladies"); setPage(1); }} className={cn("flex-1 text-xs font-bold py-1.5 px-2 rounded-md transition-colors whitespace-nowrap", genderPreference === "ladies" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>Ladies</button>
                                    </>
                                  ) : (
                                    <>
                                      <button type="button" onClick={() => { setGenderPreference("family"); setPage(1); }} className={cn("flex-1 text-xs font-bold py-1.5 px-2 rounded-md transition-colors whitespace-nowrap", genderPreference === "family" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>Family</button>
                                      <button type="button" onClick={() => { setGenderPreference("bachelors"); setPage(1); }} className={cn("flex-1 text-xs font-bold py-1.5 px-2 rounded-md transition-colors whitespace-nowrap", genderPreference === "bachelors" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>Bachelors</button>
                                      <button type="button" onClick={() => { setGenderPreference("couple"); setPage(1); }} className={cn("flex-1 text-xs font-bold py-1.5 px-2 rounded-md transition-colors whitespace-nowrap", genderPreference === "couple" ? "bg-white shadow-sm text-brand-green" : "text-slate-500 hover:text-slate-700")}>Couples</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Mobile-only: Price + Location in 2-col grid */}
                            <div className="grid grid-cols-2 gap-2 lg:hidden">
                              <div className={cn("flex flex-col gap-1", searchMode === "agencies" && "opacity-30 pointer-events-none select-none relative")}>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Price</span>
                                <Select value={priceRange === "all" ? undefined : priceRange} onValueChange={(val) => { setPriceRange(val || "all"); setPage(1); }}>
                                  <SelectTrigger className="w-full bg-white border border-slate-200 rounded-md h-8 px-2 font-semibold text-slate-800 text-[11px]">
                                    <SelectValue placeholder="Any">{priceRange === "under-50k" ? "<₹50k" : priceRange === "50k-5l" ? "₹50k-5L" : priceRange === "5l-15l" ? "₹5-15L" : priceRange === "15l-50l" ? "₹15-50L" : priceRange === "50l-1cr" ? "₹50L-1Cr" : priceRange === "above-1cr" ? ">₹1Cr" : "Any"}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-60">
                                    <SelectItem value="all">Any Price</SelectItem>
                                    <SelectItem value="under-50k">Under ₹50k</SelectItem>
                                    <SelectItem value="50k-5l">₹50k - ₹5L</SelectItem>
                                    <SelectItem value="5l-15l">₹5L - ₹15L</SelectItem>
                                    <SelectItem value="15l-50l">₹15L - ₹50L</SelectItem>
                                    <SelectItem value="50l-1cr">₹50L - ₹1Cr</SelectItem>
                                    <SelectItem value="above-1cr">Above ₹1Cr</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">City</span>
                                <div className={cn("flex items-center gap-1 bg-white border rounded-md h-8 px-2 transition-all", gpsActive ? "border-emerald-500" : "border-slate-200")}>
                                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                  <input type="text" placeholder="City..." value={searchCity}
                                    onChange={(e) => setSearchCity(e.target.value)}
                                    onBlur={() => { setCity(searchCity); setPage(1); }}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setCity(searchCity); setPage(1); } }}
                                    className="w-full bg-transparent border-0 font-semibold text-slate-800 text-[11px] focus:outline-none p-0 placeholder:text-slate-400"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* GPS Proximity */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">GPS Nearby</span>
                              <button type="button" onClick={toggleGPS} disabled={gpsLoading}
                                className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-bold transition-all cursor-pointer ${gpsActive ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                                  }`}
                              >
                                {gpsLoading ? <span className="h-3.5 w-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : (
                                  <><MapPin className={`h-3 w-3 ${gpsActive ? "text-emerald-600 animate-bounce" : "text-slate-400"}`} />
                                    {gpsActive ? "Proximity Active" : "Detect GPS Location"}</>
                                )}
                              </button>
                            </div>

                            {/* Radius + Limit in 2-col */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className={cn("flex flex-col gap-1", !gpsActive && "opacity-30 pointer-events-none select-none relative")}>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Radius</span>
                                <Select value={String(radius)} onValueChange={(val) => { setRadius(Number(val || "20")); setPage(1); }} disabled={!gpsActive}>
                                  <SelectTrigger className="w-full bg-white border border-slate-200 rounded-md h-8 px-2 font-semibold text-slate-800 text-[11px] disabled:opacity-50">
                                    <SelectValue placeholder="20 km" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-60">
                                    <SelectItem value="5">5 km</SelectItem>
                                    <SelectItem value="10">10 km</SelectItem>
                                    <SelectItem value="20">20 km</SelectItem>
                                    <SelectItem value="50">50 km</SelectItem>
                                    <SelectItem value="100">100 km</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Per Page</span>
                                <Select value={String(limit)} onValueChange={(val) => { setLimit(Number(val || "12")); setPage(1); }}>
                                  <SelectTrigger className="w-full bg-white border border-slate-200 rounded-md h-8 px-2 font-semibold text-slate-800 text-[11px]">
                                    <SelectValue placeholder="12" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-60">
                                    <SelectItem value="12">12</SelectItem>
                                    <SelectItem value="24">24</SelectItem>
                                    <SelectItem value="48">48</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Apply button — mobile only */}
                            <button
                              type="button"
                              onClick={() => setShowAdvancedPopover(false)}
                              className="lg:hidden w-full h-10 rounded-lg bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-sm transition-colors mt-1"
                            >
                              Apply Filters
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </form>
          </div>

          {/* Active Filter Chips — visible on all screen sizes */}
          {(city || limit !== 12 || (searchMode !== "agencies" && (intent || category || priceRange !== "all" || gpsActive))) && (
            <div className="hidden lg:flex items-center gap-2 mt-4 flex-wrap relative z-20 w-full px-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mr-1">Active:</span>

              {intent && searchMode !== "agencies" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
                  Intent: {intent === "buy" ? "For Sale" : intent === "rent" ? "For Rent" : "For Lease"}
                  <X className="h-3 w-3 text-slate-400 hover:text-rose-600 cursor-pointer ml-1" onClick={() => { setIntent(""); setPage(1); }} />
                </span>
              )}

              {category && searchMode !== "agencies" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
                  Type: {category.replace("_", " ")}
                  <X className="h-3 w-3 text-slate-400 hover:text-rose-600 cursor-pointer ml-1" onClick={() => { setCategory(""); setPage(1); }} />
                </span>
              )}

              {city && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
                  Location: {city}
                  <X className="h-3 w-3 text-slate-400 hover:text-rose-600 cursor-pointer ml-1" onClick={() => { setCity(""); setSearchCity(""); setPage(1); }} />
                </span>
              )}

              {priceRange !== "all" && searchMode !== "agencies" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
                  Budget: {
                    priceRange === "under-50k" ? "Under ₹50k" :
                      priceRange === "50k-5l" ? "₹50k - ₹5L" :
                        priceRange === "5l-15l" ? "₹5L - ₹15L" :
                          priceRange === "15l-50l" ? "₹15L - ₹50L" :
                            priceRange === "50l-1cr" ? "₹50L - ₹1Cr" : "Above ₹1Cr"
                  }
                  <X className="h-3 w-3 text-slate-400 hover:text-rose-600 cursor-pointer ml-1" onClick={() => { setPriceRange("all"); setPage(1); }} />
                </span>
              )}

              {gpsActive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
                  GPS Nearby: {detectedLocation || `${radius} km`}
                  <X className="h-3 w-3 text-slate-400 hover:text-rose-600 cursor-pointer ml-1" onClick={toggleGPS} />
                </span>
              )}

              {limit !== 12 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-sm">
                  Limit: {limit} / page
                  <X className="h-3 w-3 text-slate-400 hover:text-rose-600 cursor-pointer ml-1" onClick={() => { setLimit(12); setPage(1); }} />
                </span>
              )}

              <button
                type="button"
                onClick={handleResetAll}
                className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 ml-1 cursor-pointer transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Title Grid Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 mt-6 border-b border-slate-200/60 pb-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <div className="text-left">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight capitalize">
                  {searchMode === "agencies" ? "Verified Agencies" : (category ? category.replace("_", " / ") : "Residence")}{city ? ` in ${city}` : ""}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5 font-semibold">
                  {searchMode === "agencies" ? (
                    <>We found <span className="font-extrabold text-slate-900">{filteredAgencies.length}</span> {filteredAgencies.length === 1 ? "agency" : "agencies"}</>
                  ) : (
                    <>We found <span className="font-extrabold text-slate-900">{filteredProperties.length}</span> {filteredProperties.length === 1 ? "property" : "properties"}</>
                  )}
                </p>
              </div>

              {/* Mobile Gender Preference */}
              {searchMode !== "agencies" && category && ["pg", "hostel", "pg_hostel", "villa_house", "apartment"].includes(category) && (
                <div className="flex md:hidden bg-slate-100/80 border border-slate-200/50 p-1 rounded-lg shrink-0 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => { setGenderPreference("any"); setPage(1); }}
                    className={cn(
                      "px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                      genderPreference === "any" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                    )}
                  >
                    All
                  </button>
                  {["pg", "hostel", "pg_hostel"].includes(category) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setGenderPreference("men"); setPage(1); }}
                        className={cn(
                          "px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                          genderPreference === "men" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                        )}
                      >
                        Men
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGenderPreference("ladies"); setPage(1); }}
                        className={cn(
                          "px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                          genderPreference === "ladies" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                        )}
                      >
                        Ladies
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setGenderPreference("family"); setPage(1); }}
                        className={cn(
                          "px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                          genderPreference === "family" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                        )}
                      >
                        Family
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGenderPreference("bachelors"); setPage(1); }}
                        className={cn(
                          "px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                          genderPreference === "bachelors" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                        )}
                      >
                        Bachelors
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGenderPreference("couple"); setPage(1); }}
                        className={cn(
                          "px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                          genderPreference === "couple" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                        )}
                      >
                        Couples
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 mt-3 md:mt-0">
              {searchMode !== "agencies" && (
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  {properties.length > 0 && (
                    <span className="text-[10px] text-brand-green px-2.5 py-1 rounded-full font-black uppercase tracking-wider shrink-0">
                      PAGE {page}
                    </span>
                  )}
                  {/* Desktop Gender Preference */}
                  {category && ["pg", "hostel", "pg_hostel", "villa_house", "apartment"].includes(category) && (
                    <div className="hidden md:flex bg-slate-100/80 border border-slate-200/50 p-1 rounded-lg shrink-0">
                      <button
                        type="button"
                        onClick={() => { setGenderPreference("any"); setPage(1); }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                          genderPreference === "any" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                        )}
                      >
                        All
                      </button>
                      {["pg", "hostel", "pg_hostel"].includes(category) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => { setGenderPreference("men"); setPage(1); }}
                            className={cn(
                              "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                              genderPreference === "men" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                            )}
                          >
                            Men
                          </button>
                          <button
                            type="button"
                            onClick={() => { setGenderPreference("ladies"); setPage(1); }}
                            className={cn(
                              "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                              genderPreference === "ladies" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                            )}
                          >
                            Ladies
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { setGenderPreference("family"); setPage(1); }}
                            className={cn(
                              "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                              genderPreference === "family" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                            )}
                          >
                            Family
                          </button>
                          <button
                            type="button"
                            onClick={() => { setGenderPreference("bachelors"); setPage(1); }}
                            className={cn(
                              "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                              genderPreference === "bachelors" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                            )}
                          >
                            Bachelors
                          </button>
                          <button
                            type="button"
                            onClick={() => { setGenderPreference("couple"); setPage(1); }}
                            className={cn(
                              "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                              genderPreference === "couple" ? "bg-white text-brand-green shadow-sm" : "text-slate-500 hover:text-slate-700 cursor-pointer"
                            )}
                          >
                            Couples
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 shrink-0 whitespace-nowrap ml-auto md:ml-0">
                    <span className="shrink-0">Sort By:</span>
                    <Select
                    value={sortBy || "newest"}
                    onValueChange={(val) => {
                      setSortBy(val || "newest");
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-auto border-none bg-transparent hover:bg-slate-100/50 rounded-md h-7 px-1.5 font-bold text-slate-800 text-xs focus:ring-0 focus:ring-transparent focus:ring-offset-0 cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <SelectValue placeholder="Default">
                        {sortBy === "price_asc" ? "Low to High" : sortBy === "price_desc" ? "High to Low" : "newest"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 shadow-md rounded-md p-1 z-30">
                      <SelectItem value="newest">newest</SelectItem>
                      <SelectItem value="price_asc">Low to High</SelectItem>
                      <SelectItem value="price_desc">High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>
              )}
            </div>
          </div>

          {/* Listings Content */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : searchMode === "agencies" ? (
            filteredAgencies.length === 0 ? (
              /* Contextual Empty State for Agencies */
              <div className="flex flex-col items-center justify-center border border-slate-100 bg-white rounded-[32px] p-16 text-center shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-6">
                  <Building2 className="h-10 w-10 text-brand-green" />
                </div>

                {searchQuery ? (
                  <>
                    <h3 className="text-xl font-bold text-slate-900">No agencies matched "{searchQuery}"</h3>
                    <p className="text-slate-500 max-w-sm mt-1 text-sm">
                      Try typing a different name or resetting the search input.
                    </p>
                    <Button
                      onClick={() => setSearchQuery("")}
                      className="mt-6 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-semibold rounded-full px-6"
                    >
                      Clear Search
                    </Button>
                  </>
                ) : city ? (
                  <>
                    <h3 className="text-xl font-bold text-slate-900">No agencies found in "{city}"</h3>
                    <p className="text-slate-500 max-w-sm mt-1 text-sm">
                      Try searching for a different city or clearing the text filter.
                    </p>
                    <Button
                      onClick={() => { setCity(""); setSearchCity(""); }}
                      className="mt-6 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-semibold rounded-full px-6"
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-slate-900">No agencies listed yet</h3>
                    <p className="text-slate-500 max-w-sm mt-1 text-sm">
                      No agencies are currently active on the platform.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Agency Directory Grid */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                  {filteredAgencies.map((agency) => {
                    const savedBanner = (agency as any).banner_key || localStorage.getItem(`agency_banner_${agency.id}`);
                    const savedLogo = agency.logo_key || localStorage.getItem(`agency_logo_${agency.id}`);

                    return (
                      <div
                        key={agency.id}
                        onClick={() => navigate(`/agencies/${agency.id}`)}
                        className="border border-slate-200 bg-white hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group rounded-xl text-left cursor-pointer"
                      >
                        {/* Banner */}
                        <div className="relative h-28 sm:h-32 shrink-0 z-0">
                          {savedBanner ? (
                            <img src={savedBanner} alt="banner" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-linear-to-r from-[#014645] to-emerald-600 relative">
                              <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]" />
                            </div>
                          )}

                          {/* Verified badge */}
                          {agency.verification_status === "verified" && (
                            <div className="absolute top-2.5 right-2.5 z-10">
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/95 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border border-emerald-100 shadow-sm backdrop-blur-sm">
                                <Shield className="h-3 w-3 fill-emerald-500 text-white shrink-0" /> Verified
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Logo + name row — relative z-10 so logo stays ON TOP of banner */}
                        <div className="px-5 sm:px-6 pb-5 relative z-10 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Logo avatar overlapping banner bottom-left with z-20 */}
                            <div className="flex items-end justify-between relative z-20" style={{ marginTop: -28 }}>
                              <div className="h-14 w-14 rounded-full border-3 border-white shadow-md overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 relative z-20">
                                {savedLogo ? (
                                  <img src={savedLogo} alt={agency.display_name} className="h-full w-full object-cover" />
                                ) : agency.logo_key ? (
                                  <img src={agency.logo_key} alt={agency.display_name} className="h-full w-full object-cover" />
                                ) : (
                                  <Building2 className="h-6 w-6 text-white/60" />
                                )}
                              </div>
                            </div>

                            {/* Name + location */}
                            <h3 className="text-base font-bold text-slate-900 line-clamp-1 leading-snug mt-3 my-0 group-hover:text-brand-green transition-colors">
                              {agency.display_name}
                            </h3>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{agency.location_area}, {agency.location_city}</span>
                            </div>

                            {/* About snippet */}
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-2.5">
                              {agency.about || "Real estate agency on Letsellr."}
                            </p>
                          </div>

                          {/* Footer row */}
                          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inventory</div>
                              <div className="text-xs font-bold text-[#014645] mt-0.5">
                                {agency.total_listings} {agency.total_listings === 1 ? "Property" : "Properties"}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold px-5 py-2 rounded-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                            >
                              View <span className="font-mono text-xs leading-none">→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <Pagination className="mt-12 border-t border-slate-200/80 pt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(p => p - 1);
                        }}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {page > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(page - 1);
                          }}
                          className="cursor-pointer"
                        >
                          {page - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive
                        onClick={(e) => e.preventDefault()}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>

                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(page + 1);
                          }}
                          className="cursor-pointer"
                        >
                          {page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(p => p + 1);
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )
          ) : filteredProperties.length === 0 ? (
            /* Contextual Empty State */
            <div className="flex flex-col items-center justify-center border border-slate-100 bg-white rounded-[32px] p-16 text-center shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-6">
                <Home className="h-10 w-10 text-brand-green" />
              </div>

              {searchQuery ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900">No properties matched "{searchQuery}"</h3>
                  <p className="text-slate-500 max-w-sm mt-1 text-sm">
                    Try typing a different keyword or resetting the search input.
                  </p>
                  <Button
                    onClick={() => setSearchQuery("")}
                    className="mt-6 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-semibold rounded-full px-6"
                  >
                    Clear Search
                  </Button>
                </>
              ) : gpsActive && city ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900">No properties matched combined filters</h3>
                  <p className="text-slate-500 max-w-md mt-2 text-sm leading-relaxed">
                    We are searching for properties that are located within 20km of your coordinates <strong>AND</strong> match the city text search: <span className="text-slate-900 font-semibold">"{city}"</span>.
                    <br />Try disabling one of these active restrictions to broaden your search:
                  </p>
                  <div className="flex gap-4 mt-6">
                    <Button
                      onClick={() => { setGpsActive(false); setLat(null); setLng(null); }}
                      className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-semibold rounded-full px-6"
                    >
                      Disable GPS Filter
                    </Button>
                    <Button
                      onClick={() => { setCity(""); setSearchCity(""); }}
                      variant="outline"
                      className="border-slate-200 text-slate-700 text-xs font-semibold rounded-full px-6"
                    >
                      Clear City Filter
                    </Button>
                  </div>
                </>
              ) : gpsActive ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900">No properties found nearby</h3>
                  <p className="text-slate-500 max-w-sm mt-1 text-sm">
                    No listings are currently available within 20km of your GPS location.
                  </p>
                  <Button
                    onClick={() => { setGpsActive(false); setLat(null); setLng(null); }}
                    className="mt-6 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-semibold rounded-full px-6"
                  >
                    Disable GPS Search
                  </Button>
                </>
              ) : city ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900">No properties found in "{city}"</h3>
                  <p className="text-slate-500 max-w-sm mt-1 text-sm">
                    Try searching for a different city or clearing the text filter.
                  </p>
                  <Button
                    onClick={() => { setCity(""); setSearchCity(""); }}
                    className="mt-6 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-semibold rounded-full px-6"
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-900">No properties listed yet</h3>
                  <p className="text-slate-500 max-w-sm mt-1 text-sm">
                    Try resetting active category or intent filters to view all listings.
                  </p>
                  <Button
                    onClick={handleResetAll}
                    className="mt-6 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-semibold rounded-full px-6"
                  >
                    Reset All Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Grid layout matching design */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                {filteredProperties.map((prop) => (
                  <Card
                    key={prop.id}
                    className="border border-slate-100 bg-white hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group p-3.5 rounded-xl"
                    // onClick={() => handleOpenDetails(prop)}
                  >
                    {/* Aspect image box */}
                    <div className="h-48 w-full rounded-lg overflow-hidden relative shrink-0">
                      <img
                        src={prop.photos && prop.photos.length > 0 ? prop.photos[0] : getCategoryFallbackImage(prop.category)}
                        alt={prop.title}
                        onClick={() => handleOpenDetails(prop)}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Absolute tags matching Webflow theme */}
                      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
                        <span className="inline-flex rounded-[6px] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow-sm uppercase tracking-wider">
                          For {prop.intent === "buy" ? "Sale" : prop.intent === "rent" ? "Rent" : "Lease"}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="inline-flex rounded-[6px] bg-amber-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm uppercase tracking-wider">
                          {prop.category.replace("_", " ")}
                        </span>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded bg-brand-green text-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest shadow-sm">
                         <Shield size={12} /> verified
                        </span>
                      </div>
                    </div>

                    <CardHeader className="pb-1.5 flex-1 flex flex-col justify-between px-1 pt-3.5 space-y-0">
                      <div className="space-y-1">
                        {/* Location text top-aligned in Webflow design */}
                        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {prop.location_area}, {prop.location_city}
                        </div>

                        <CardTitle className="text-base font-semibold text-slate-900 line-clamp-1 pt-1 group-hover:text-brand-green transition-colors leading-tight m-0">
                          {prop.title}
                        </CardTitle>

                        {/* Specs Row with no border layout */}
                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] text-slate-500 font-medium py-1.5 mt-1.5 mb-2.5">
                          <div className="flex items-center gap-1 shrink-0">
                            <Bed className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{prop.bedrooms || 0} Bed Room</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Bath className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{prop.bathrooms || 0} Bath</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Maximize className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{prop.area && Number(prop.area) > 0 ? `${Number(prop.area).toLocaleString()} SQ FT` : "Not Specified"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Price & Details button */}
                      <div className="flex items-center justify-between pt-2 w-full gap-1.5 border-t border-slate-50">
                        <span className="font-extrabold text-sm sm:text-base text-slate-950 whitespace-nowrap">
                          {formatPrice(prop.price, prop.price_unit)}
                        </span>
                        <button
                          onClick={() => handleOpenDetails(prop)}
                          className="bg-brand-green hover:bg-brand-green-hover text-white text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                        >
                          View Details <span className="font-mono text-xs leading-none">→</span>
                        </button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              <Pagination className="mt-12 border-t border-slate-200/80 pt-8 pb-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(p => p - 1);
                      }}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(page - 1);
                        }}
                        className="cursor-pointer"
                      >
                        {page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive
                      onClick={(e) => e.preventDefault()}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>

                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(page + 1);
                        }}
                        className="cursor-pointer"
                      >
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(p => p + 1);
                      }}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )
          }
        </main>
      )}

      {viewMode === "list" && searchMode === "properties" && (
        <div className={cn("fixed bottom-6 right-6 z-40", showAdvancedPopover && "hidden lg:block")}>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className="bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-brand-green"
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Map View</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ── Owner & Agency Dashboard ────────────────────────────────────────────────
export const OwnerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-left">
      <AppNavbar logoHref="/owner/dashboard" title="Partner Dashboard" />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Property Management</h1>
            <p className="mt-1 text-sm text-slate-500">List and manage your property portfolio.</p>
          </div>
          <Button className="bg-brand-green hover:bg-brand-green-hover text-white flex items-center gap-1.5 self-start">
            <PlusCircle className="h-4.5 w-4.5" />
            Add Property
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">
                Active Listings
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-brand-deep-green">0 Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">Properties visible on search.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">
                Leads / Inquiries
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-brand-deep-green">0 Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">Client messages waiting response.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">
                Total Views
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-brand-deep-green">0 Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">Number of users who saw listings.</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty state management panel */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-white rounded-xl p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light-green text-brand-deep-green mb-4">
            <Home className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No properties listed yet</h3>
          <p className="text-slate-500 max-w-sm mt-1 text-sm">
            Add properties to start showcasing them to active buyers and renters.
          </p>
          <Button className="mt-6 bg-brand-green hover:bg-brand-green-hover text-white">
            Add Your First Listing
          </Button>
        </div>
      </main>
    </div>
  );
};

// ── Admin Dashboard ─────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-left">
      <AppNavbar logoHref="/admin" title="Admin Dashboard" />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Control Room</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor registrations, roles, and database status.</p>
        </div>

        {/* System Stats */}
        <div className="grid gap-6 sm:grid-cols-4 mb-8">
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Total Users</CardDescription>
              <CardTitle className="text-2xl font-bold text-brand-deep-green">42</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Agencies</CardDescription>
              <CardTitle className="text-2xl font-bold text-brand-deep-green">6</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Owners</CardDescription>
              <CardTitle className="text-2xl font-bold text-brand-deep-green">14</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-100 bg-white">
            <CardHeader className="pb-1">
              <CardDescription className="font-semibold uppercase tracking-wider text-slate-400">Active Listings</CardDescription>
              <CardTitle className="text-2xl font-bold text-brand-deep-green">112</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Administration Table Mockup */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold">User Registrations Queue</CardTitle>
            <CardDescription>Verify newly registered partners and agencies.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500">
                <thead className="bg-slate-50 text-xs text-slate-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: "Apex Properties", email: "contact@apex.com", role: "agency", status: "Pending" },
                    { name: "Sarah Connor", email: "sarah@cyber.com", role: "owner", status: "Verified" },
                    { name: "John Miller", email: "john@miller.me", role: "user", status: "Verified" },
                  ].map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4 capitalize">{u.role}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.status === "Verified" ? "bg-brand-light-green text-brand-deep-green" : "bg-amber-50 text-amber-800"
                          }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 text-xs">
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
