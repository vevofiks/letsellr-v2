import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Leaflet default marker icons for Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { AppNavbar } from "@/components/AppNavbar";

import { 
  ArrowLeft,
  MapPin, 
  Bed, 
  Bath, 
  Maximize,
  HelpCircle,
  MessageSquare,
  Clock,
  Shield
} from "lucide-react";

const getCategoryFallbackImage = (category: string) => {
  switch (category) {
    case "apartment":
      return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
    case "villa_house":
      return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
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

const getPhotosGrid = (photos: string[] | undefined, category: string) => {
  const fallbackPhotos = {
    apartment: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
    ],
    villa_house: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
    ],
    commercial: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80"
    ],
    pg: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"
    ],
    hostel: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"
    ],
    land: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
    ]
  };

  const list = photos && photos.length > 0 ? [...photos] : [];
  const catKey = (category in fallbackPhotos) ? (category as keyof typeof fallbackPhotos) : 'villa_house';
  const defaults = fallbackPhotos[catKey];

  while (list.length < 5) {
    list.push(defaults[list.length % defaults.length]);
  }
  return list.slice(0, 5);
};

export const PropertyDetailsPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProperties, setRelatedProperties] = useState<any[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photosGrid = property ? getPhotosGrid(property.photos, property.category) : [];

  const handleNextPhoto = () => {
    if (photosGrid.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % photosGrid.length);
  };

  const handlePrevPhoto = () => {
    if (photosGrid.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + photosGrid.length) % photosGrid.length);
  };

  useEffect(() => {
    if (photosGrid.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNextPhoto();
      } else if (e.key === "ArrowLeft") {
        handlePrevPhoto();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photosGrid]);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fetch Property Details
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/properties/${propertyId}`);
        setProperty(res.data);
      } catch (err: any) {
        toast.error("Failed to load property details");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId, navigate]);

  // Fetch Related Properties
  useEffect(() => {
    const fetchRelated = async () => {
      if (!property) return;
      try {
        const res = await api.get("/api/properties", {
          params: { city: property.location_city, limit: 4 }
        });
        // Filter out current property
        const filtered = (res.data.items || [])
          .filter((item: any) => item.id !== property.id)
          .slice(0, 3);
        setRelatedProperties(filtered);
      } catch (err) {
        console.error("Failed to load related properties", err);
      }
    };
    fetchRelated();
  }, [property]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (property && property.latitude && property.longitude && mapRef.current) {
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
        attributionControl: false
      }).setView([property.latitude, property.longitude], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.marker([property.latitude, property.longitude])
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 2px;">
            <strong style="color: #1b3b2b;">${property.title}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">${property.location_area}, ${property.location_city}</span>
          </div>
        `)
        .openPopup();

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [property]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  const handleWhatsAppContact = async () => {
    if (!property) return;
    if (!user) {
      toast.error("Please sign in to contact the owner.");
      navigate("/login", { state: { from: `/properties/${property.id}` } });
      return;
    }
    try {
      await api.get(`/api/properties/ref/${property.ref}/enquiry-link`);
    } catch (err) {
      console.error("Failed to record enquiry", err);
    }
    const number = property.owner_whatsapp || property.owner_phone;
    const message = encodeURIComponent(`Hi, I'm interested in your property ${property.title} (Ref: ${property.ref})`);
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

  const handleCallContact = (e: React.MouseEvent) => {
    if (!property) return;
    if (!user) {
      e.preventDefault();
      toast.error("Please sign in to view contact details.");
      navigate("/login", { state: { from: `/properties/${property.id}` } });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f5] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="h-10 w-10 border-4 border-[#1b3b2b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-bold text-sm">Loading Property details...</p>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const descriptionText = property.description || "No description provided for this listing.";
  const isDescriptionLong = descriptionText.length > 250;
  const displayedDescription = showFullDescription || !isDescriptionLong 
    ? descriptionText 
    : `${descriptionText.slice(0, 250)}...`;

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-left relative font-sans">
      
      <AppNavbar logoHref="/dashboard" />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Main Column: Media Grid, Specs, Description, Related list, Map */}
          <div className="flex-1 w-full space-y-8">
            
            {/* Premium Interactive Image Carousel with Left-aligned Back Icon */}
            <div className="flex items-start gap-4">
              {/* Circular Back button on the left of carousel (Desktop only) */}
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-[#1b3b2b] hover:text-[#152e22] transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer mt-1"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* Carousel wrapper */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="relative h-[300px] sm:h-[480px] w-full overflow-hidden rounded-[24px] bg-slate-900 border border-slate-100 shadow-md group">
                  {/* Floating Back button (Mobile only) */}
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="absolute top-4 left-4 z-20 md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white/95 hover:bg-white backdrop-blur-sm text-[#1b3b2b] hover:text-[#152e22] transition-all shadow-md active:scale-95 cursor-pointer border border-slate-100"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {/* Active Image */}
                  <img 
                    src={photosGrid[activePhotoIndex]} 
                    alt={`${property.title} - View ${activePhotoIndex + 1}`} 
                    className="h-full w-full object-cover transition-all duration-500 ease-in-out"
                  />

                  {/* Left/Right floating chevrons */}
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-sm text-[#1b3b2b] hover:text-[#152e22] transition-all shadow-md cursor-pointer opacity-0 group-hover:opacity-100 border border-slate-100"
                    aria-label="Previous image"
                  >
                    <svg className="h-6 w-6 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-sm text-[#1b3b2b] hover:text-[#152e22] transition-all shadow-md cursor-pointer opacity-0 group-hover:opacity-100 border border-slate-100"
                    aria-label="Next image"
                  >
                    <svg className="h-6 w-6 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>

                  {/* Agency listing badge overlay (top-right on mobile, top-left on desktop) */}
                  {property.owner_role === "agency" && (
                    <div className="absolute top-4 right-4 z-10 md:left-4 md:right-auto">
                      <span className="bg-amber-500 text-white px-3 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        Agency Listing
                      </span>
                    </div>
                  )}

                  {/* Counter overlay */}
                  <div className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-sm text-white text-[11px] font-bold rounded-full px-3.5 py-1.5 shadow-sm">
                    {activePhotoIndex + 1} / {photosGrid.length}
                  </div>
                </div>

                {/* Thumbnails indicator row */}
                {photosGrid.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 max-w-full justify-center scrollbar-none">
                    {photosGrid.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIndex(i)}
                        className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 cursor-pointer ${
                          i === activePhotoIndex ? "border-[#1b3b2b] scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Title & Info Block */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-teal-50 border border-teal-100 text-[#1b3b2b] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  {property.category.replace("_", " ")}
                </span>
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  For {property.intent === "buy" ? "Sale" : property.intent === "rent" ? "Rent" : "Lease"}
                </span>
              </div>
              
              <h1 className="text-3xl font-black text-slate-900 leading-tight m-0">
                {property.title}
              </h1>
              
              <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#1b3b2b]" />
                {property.location_address || `${property.location_area}, ${property.location_city}`}
              </div>
            </div>

            {/* Premium Specs Box Row matching reference image */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border border-slate-100 bg-white rounded-2xl p-4.5 shadow-sm text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bedroom</span>
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                  <Bed className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{property.bedrooms || 0} Bed</span>
                </div>
              </div>
              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bathroom</span>
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                  <Bath className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{property.bathrooms || 0} Bath</span>
                </div>
              </div>
              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Area</span>
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                  <Maximize className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{property.area ? `${property.area.toLocaleString()} sqft` : "N/A"}</span>
                </div>
              </div>
              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Furnishing</span>
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm capitalize">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 flex items-center justify-center shrink-0">
                    <span className="h-1.5 w-1.5 bg-slate-500 rounded-full" />
                  </div>
                  <span>{property.furnishing || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Area Safety</span>
                <div className="flex items-center gap-1 pt-1.5">
                  <div className="h-1.5 w-6 rounded bg-[#1b3b2b]" />
                  <div className="h-1.5 w-6 rounded bg-[#1b3b2b]" />
                  <div className="h-1.5 w-6 rounded bg-[#1b3b2b]" />
                  <div className="h-1.5 w-6 rounded bg-[#1b3b2b]" />
                  <div className="h-1.5 w-6 rounded bg-slate-100" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                {displayedDescription}
              </p>
              {isDescriptionLong && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[#1b3b2b] hover:text-[#152e22] text-xs font-bold underline cursor-pointer focus:outline-none"
                >
                  {showFullDescription ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

            {/* Map Container */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="h-5 w-5 text-[#1b3b2b]" /> Location Map
              </h3>
              {property.latitude && property.longitude ? (
                <div 
                  ref={mapRef} 
                  className="h-64 w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative z-10" 
                  style={{ minHeight: '260px' }}
                />
              ) : (
                <div className="h-64 w-full bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                  <HelpCircle className="h-8 w-8 text-slate-300" />
                  Coordinates not provided for this listing.
                </div>
              )}
            </div>

            {/* Related Properties row */}
            {relatedProperties.length > 0 && (
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Properties available in the same area</h3>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                  {relatedProperties.map((related) => (
                    <Card 
                      key={related.id} 
                      onClick={() => {
                        navigate(`/properties/${related.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="border border-slate-100 bg-white hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group p-3.5 rounded-[20px] cursor-pointer"
                    >
                      {/* Aspect image box */}
                      <div className="h-40 w-full rounded-[14px] overflow-hidden relative shrink-0">
                        <img
                          src={related.photos && related.photos.length > 0 ? related.photos[0] : getCategoryFallbackImage(related.category)}
                          alt={related.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex rounded-[6px] bg-white px-2 py-0.5 text-[9px] font-semibold text-slate-800 shadow-sm uppercase tracking-wider">
                            For {related.intent === "buy" ? "Sale" : related.intent === "rent" ? "Rent" : "Lease"}
                          </span>
                        </div>
                      </div>

                      <div className="pb-1 px-0.5 pt-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            {related.location_area}, {related.location_city}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-950 line-clamp-1 pt-0.5 group-hover:text-[#1b3b2b] transition-colors leading-tight">
                            {related.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2.5">
                          <span className="font-extrabold text-sm text-slate-950">
                            {formatPrice(related.price, related.price_unit)}
                          </span>
                          <span className="text-[10px] font-bold text-[#1b3b2b] flex items-center gap-0.5">
                            Details <span className="font-mono">→</span>
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar: Cost widget and contact details */}
          <div className="w-full lg:w-[380px] shrink-0 sticky top-24 space-y-6">
            <Card className="border border-slate-100 bg-white shadow-2xl rounded-3xl p-6 relative overflow-hidden">
              
              {/* Cost widget title */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  Enquiry & Pricing
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Direct Owner check in • Verified listing
                </p>
              </div>

              {/* Price row */}
              <div className="flex items-baseline gap-2 pt-4 pb-2 border-b border-slate-100">
                <span className="text-3xl font-black text-[#1b3b2b]">
                  {formatPrice(property.price, property.price_unit)}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {property.intent === "buy" ? "Total Price" : "Month"}
                </span>
              </div>

              {/* Cancellation policy box */}
              <div className="my-5 space-y-3.5 text-xs text-slate-700 font-medium">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing Policy</h4>
                <div className="bg-slate-50 rounded-2xl p-4.5 space-y-3 border border-slate-100/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refundable Deposit</span>
                    <span className="font-extrabold text-slate-900">
                      {property.deposit ? `₹${property.deposit.toLocaleString()}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2.5">
                    <span className="text-slate-500">Brokerage Commission</span>
                    <span className="font-extrabold text-emerald-600">₹0 (Free)</span>
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-between items-center py-2.5 font-bold text-sm text-slate-900 border-t border-slate-100">
                <span>Estimated Total:</span>
                <span className="text-base font-black text-[#1b3b2b]">
                  {formatPrice(property.price + (property.deposit || 0), property.price_unit)}
                </span>
              </div>

              {/* Action Button: WhatsApp primary */}
              <div className="mt-5 space-y-3">
                <Button
                  onClick={handleWhatsAppContact}
                  className="w-full bg-[#1b3b2b] hover:bg-[#152e22] text-white font-extrabold py-4 text-sm rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-900/10"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  Chat on WhatsApp
                </Button>
                
                {property.owner_phone && (
                  <a 
                    href={`tel:${property.owner_phone}`} 
                    onClick={handleCallContact}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold py-3 text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    Call Owner / Agency
                  </a>
                )}
              </div>

              {/* Timer tag */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 font-medium text-left">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Only a few listings left</strong> in this area. Book your call or WhatsApp enquiry early to finalize dates.
                </span>
              </div>

            </Card>

            {/* Direct owner badge */}
            <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
              <div className="p-2 rounded-xl bg-teal-50 text-[#1b3b2b]">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-slate-900">Direct Owner Listing</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Broker commission</p>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
};
