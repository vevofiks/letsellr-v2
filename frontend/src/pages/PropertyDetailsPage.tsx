import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Leaflet default marker icons for Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { AppNavbar } from "@/components/AppNavbar";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";
import { Seo } from "@/components/Seo";
import { APP_URL } from "@/lib/site";
import { buildPropertyJsonLd, buildBreadcrumbJsonLd } from "@/lib/jsonLd";
import { propertyPath, propertyUrl } from "@/lib/urls";
import { useConfirm } from "@/components/ConfirmDialogProvider";

import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize,
  HelpCircle,
  MessageSquare,
  Clock,
  Shield,
  Play,
  Eye,
  Mail,
  Star,
  Trash2,
  Edit3,
  Building2,
  ChevronRight,
  Share2,
  CheckCircle2,
  X,
} from "lucide-react";

const getYoutubeEmbedUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?playsinline=1&enablejsapi=1&rel=0`;
  }
  return null;
};

const getYoutubeThumbnailUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return null;
};



export const PropertyDetailsPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();

  const [property, setProperty] = useState<any | null>(null);
  const [agency, setAgency] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProperties, setRelatedProperties] = useState<any[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: AuthModalMode }>({
    open: false,
    mode: "login",
  });
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const validateReviewComment = (comment: string): string | null => {
    const trimmed = comment.trim();
    if (!trimmed) {
      return "Review comment cannot be empty.";
    }
    if (/^[^a-zA-Z0-9]+$/.test(trimmed)) {
      return "Review comment must contain actual text, not just symbols.";
    }
    const charOnly = trimmed.replace(/\s+/g, "");
    if (charOnly.length > 1 && new Set(charOnly).size === 1) {
      return "Review comment cannot contain only repeated characters.";
    }
    return null;
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await api.get(`/api/properties/${propertyId}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchReviews();
    }
  }, [propertyId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a review.");
      setAuthModal({ open: true, mode: "login" });
      return;
    }

    const err = validateReviewComment(newComment);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/api/properties/${propertyId}/reviews`, {
        rating: newRating,
        comment: newComment
      });
      toast.success("Review submitted successfully!");
      setNewComment("");
      setNewRating(5);
      setReviews((prev) => [res.data, ...prev]);
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to submit review"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (review: any) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditComment("");
    setEditRating(5);
  };

  const handleUpdateReview = async (reviewId: string) => {
    const err = validateReviewComment(editComment);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      const res = await api.patch(`/api/reviews/${reviewId}`, {
        rating: editRating,
        comment: editComment
      });
      toast.success("Review updated successfully!");
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...res.data } : r))
      );
      setEditingReviewId(null);
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to update review"));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const isConfirmed = await confirm({
      title: "Delete Review",
      description: "Are you sure you want to delete this review? This action cannot be undone.",
      variant: "destructive"
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/api/reviews/${reviewId}`);
      toast.success("Review deleted successfully!");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to delete review"));
    }
  };

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      starCounts[r.rating - 1]++;
    }
  });

  const RenderStars: React.FC<{ rating: number; interactive?: boolean; onChange?: (r: number) => void; size?: number }> = ({
    rating,
    interactive = false,
    onChange,
    size = 4
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => interactive && onChange && onChange(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-all ${star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
              }`}
            style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
          />
        ))}
      </div>
    );
  };

  const mediaList = React.useMemo(() => {
    if (!property) return [];
    const list: { type: "image" | "video"; url: string; rawUrl?: string }[] = [];
    if (property.video_link) {
      const rawLinks = property.video_link.split(/[\n,\s]+/).map((s: string) => s.trim()).filter(Boolean);
      rawLinks.forEach((vUrl: string) => {
        const embedUrl = getYoutubeEmbedUrl(vUrl);
        if (embedUrl) {
          list.push({ type: "video", url: embedUrl, rawUrl: vUrl });
        }
      });
    }
    if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
      property.photos.forEach((img: string) => {
        if (img) list.push({ type: "image", url: img });
      });
    }
    return list;
  }, [property]);

  const handleNextPhoto = () => {
    if (mediaList.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevPhoto = () => {
    if (mediaList.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      handleNextPhoto();
    } else if (distance < -minSwipeDistance) {
      handlePrevPhoto();
    }
  };

  useEffect(() => {
    if (mediaList.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNextPhoto();
      } else if (e.key === "ArrowLeft") {
        handlePrevPhoto();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaList]);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fetch Property Details & Record Unique View
  // A listing is reachable by slug, UUID or ref code, but only the slug is
  // canonical. When someone arrives on an older id-based link, rewrite the
  // address bar in place so anything they copy or share from here is the good
  // URL. replace() keeps it out of history so Back still leaves the page.
  const skipNextFetchRef = useRef(false);

  const swapUrlToSlug = (loaded: { id: string; slug?: string | null }) => {
    if (!loaded?.slug || propertyId === loaded.slug) return;
    skipNextFetchRef.current = true;
    navigate(propertyPath(loaded), { replace: true });
  };

  useEffect(() => {
    // The slug rewrite in swapUrlToSlug() changes propertyId and would
    // otherwise retrigger this effect, causing a second fetch/loading
    // cycle (and a second Seo title flip) right after the first load.
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        // Call view endpoint to record unique view count and retrieve updated property details
        const res = await api.post(`/api/properties/${propertyId}/view`);
        setProperty(res.data);
        swapUrlToSlug(res.data);
      } catch (err: any) {
        // Fallback to GET endpoint if POST fails
        try {
          const fallbackRes = await api.get(`/api/properties/${propertyId}`);
          setProperty(fallbackRes.data);
          swapUrlToSlug(fallbackRes.data);
        } catch (fallbackErr: any) {
          toast.error("Failed to load property details");
          navigate("/dashboard");
        }
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

  // Fetch Agency Details if applicable
  useEffect(() => {
    const fetchAgencyDetails = async () => {
      if (property && property.owner_role === "agency" && property.owner_id) {
        try {
          const res = await api.get(`/api/agencies/${property.owner_id}`);
          setAgency(res.data);
        } catch (err) {
          console.error("Failed to load agency details", err);
        }
      } else {
        setAgency(null);
      }
    };
    fetchAgencyDetails();
  }, [property]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (property && property.latitude && property.longitude && mapRef.current) {
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
      }).setView([property.latitude, property.longitude], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 5,
        maxZoom: 13,
      }).addTo(map);

      L.marker([property.latitude, property.longitude])
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 2px;">
            <strong style="color: #0B6E4F;">${property.title}</strong><br/>
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

  const handleWhatsAppContact = async () => {
    if (!property) return;
    let serverWaLink = "";
    try {
      const res = await api.get(`/api/properties/ref/${property.ref}/enquiry-link`);
      if (res.data?.link) {
        serverWaLink = res.data.link;
      }
    } catch (err) {
      console.error("Failed to record enquiry", err);
    }

    if (serverWaLink) {
      window.open(serverWaLink, "_blank");
    } else {
      const categoryLower = (property.category || property.type || "").toLowerCase();
      const isPgOrHostel = categoryLower.includes("pg") || categoryLower.includes("hostel");

      const botNumber = import.meta.env.VITE_WHATSAPP_BOT_NUMBER || "918137090018";
      const salesNumber = import.meta.env.VITE_WHATSAPP_SALES_NUMBER || "918137090018";

      const targetNumber = isPgOrHostel ? botNumber : salesNumber;
      const cleanNumber = targetNumber.replace(/[^0-9]/g, "");

      const message = encodeURIComponent(`Hi, I'm interested in your property ${property.title} (Ref: ${property.ref})`);
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
    }
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || "Property Details",
        url: window.location.href
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Property link copied to clipboard!");
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
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center h-20 w-20">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 border-t-[#23D283] animate-spin" />
            <img
              src="/logo.png"
              alt="Letsellr Logo"
              className="h-8 w-auto z-10 animate-pulse"
            />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Property Details...</p>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const descriptionText = property.description || "No description provided for this listing.";
  const isDescriptionLong = descriptionText.length > 280;
  const displayedDescription = showFullDescription || !isDescriptionLong
    ? descriptionText
    : `${descriptionText.slice(0, 280)}...`;

  const hasBed = Boolean(property.bedrooms && property.bedrooms > 0);
  const hasBath = Boolean(property.bathrooms && property.bathrooms > 0);
  const hasArea = Boolean(property.area && Number(property.area) > 0);
  const hasFurnish = Boolean(
    property.furnishing &&
    property.furnishing.toLowerCase() !== "none" &&
    property.furnishing.toLowerCase() !== "not specified"
  );
  const hasAnySpec = hasBed || hasBath || hasArea || hasFurnish;

  const isPgOrHostelCategory = ["pg", "hostel", "pg_hostel"].includes(property.category);
  const roomSharingOptions: { sharing: number; price: number; vacancy: number }[] =
    property.extra_details?.room_sharing || [];
  const hasRoomSharing = isPgOrHostelCategory && roomSharingOptions.length > 0;

  const validVideoLinks = property.video_link 
    ? property.video_link
        .split(/[\n,\s]+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((vUrl: string) => getYoutubeEmbedUrl(vUrl))
        .filter(Boolean)
    : [];

  const RoomSharingVacancy: React.FC = () => (
    <div className="space-y-2 pt-1">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
        <Bed className="h-3.5 w-3.5 text-[#0B6E4F]" /> Room Sharing & Vacancy
      </span>
      <div className="grid grid-cols-2 gap-2">
        {roomSharingOptions.map((opt, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 space-y-0.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black text-slate-900">{opt.sharing} Sharing</span>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                  opt.vacancy > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {opt.vacancy > 0 ? `${opt.vacancy} Vacant` : "Full"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 block">
              ₹{opt.price?.toLocaleString()} / bed / mo
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const specCardClass = "space-y-1 w-full sm:w-auto pt-3 sm:pt-0 sm:pl-5 border-t sm:border-t-0 sm:border-l border-slate-100 first:border-0 first:pt-0 first:sm:pl-0";

  const seoLocation = property.location_area || property.location_city || "";
  const seoDescription = `${property.title}${seoLocation ? ` in ${seoLocation}` : ""} - ${formatPrice(property.price, property.price_unit)}. ${property.bedrooms ? `${property.bedrooms} BHK, ` : ""}verified listing direct from ${property.owner_role === "agency" ? "agency" : "owner"}, no brokerage on Letsellr.`;
  const canonicalUrl = propertyUrl(property);

  return (
    <div className="min-h-screen bg-[#f8faf9] text-left relative font-sans">
      <Seo
        title={`${property.title}${seoLocation ? ` in ${seoLocation}` : ""}`}
        description={seoDescription}
        image={property.photos?.[0]}
        url={canonicalUrl}
        type="article"
        noindex={property.status !== "live"}
        jsonLd={[
          buildPropertyJsonLd(property, canonicalUrl),
          buildBreadcrumbJsonLd([
            { name: "Home", url: `${APP_URL}/dashboard` },
            { name: "Properties", url: `${APP_URL}/properties` },
            ...(property.location_city
              ? [
                  {
                    name: property.location_city,
                    url: `${APP_URL}/properties?city=${encodeURIComponent(property.location_city)}`,
                  },
                ]
              : []),
            { name: property.title, url: canonicalUrl },
          ]),
        ]}
      />

      <AppNavbar logoHref="/dashboard" />

      {/* Main Container */}
      <main className="mx-auto max-w-9xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">

        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#0B6E4F] transition-colors cursor-pointer font-bold shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Listings</span>
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-900 font-bold truncate max-w-64 sm:max-w-xs">{property.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Side: Media Grid, Specs, Description, Amenities, Map */}
          <div className="lg:col-span-2 space-y-8">

            {/* Interactive Image Carousel */}
            <div className="space-y-2.5">
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative h-56 sm:h-72 md:h-100 w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/80 shadow-xs group touch-pan-y select-none"
              >

                {/* Active Slide */}
                {mediaList.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 gap-3">
                    <Building2 className="h-12 w-12 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">No images uploaded for this listing</span>
                  </div>
                ) : mediaList[activePhotoIndex]?.type === "video" ? (
                  <iframe
                    src={mediaList[activePhotoIndex].url}
                    title="Property Video Tour"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <img
                    onClick={() => setIsImageViewerOpen(true)}
                    src={mediaList[activePhotoIndex]?.url}
                    alt={`${property.title} - View ${activePhotoIndex + 1}`}
                    className="h-full w-full object-cover transition-all duration-500 ease-out cursor-pointer hover:scale-105"
                  />
                )}

                {/* Navigation Chevrons */}
                {mediaList.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevPhoto();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 hover:text-[#0B6E4F] transition-all shadow-md cursor-pointer z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto border border-slate-200/60 active:scale-90"
                      aria-label="Previous image"
                    >
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextPhoto();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 hover:text-[#0B6E4F] transition-all shadow-md cursor-pointer z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto border border-slate-200/60 active:scale-90"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </>
                )}

                {/* Counter Pill */}
                {mediaList.length > 0 && (
                  <div className="absolute bottom-3 right-3 z-10 pointer-events-none bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-extrabold rounded-full px-3 py-1 shadow-sm border border-white/10">
                    {activePhotoIndex + 1} / {mediaList.length}
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {mediaList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 max-w-full scrollbar-none">
                  {mediaList.map((media, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIndex(i)}
                      className={`relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 cursor-pointer ${i === activePhotoIndex ? "border-[#23D283] scale-105 shadow-sm ring-2 ring-[#23D283]/20" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                    >
                      {media.type === "video" ? (
                        <div className="relative h-full w-full bg-slate-900">
                          <img src={getYoutubeThumbnailUrl(media.rawUrl || property.video_link) || (property.photos && property.photos[0]) || ""} alt="" className="h-full w-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-5 w-5 text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <img src={media.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Location Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#23D283]/10 border border-[#23D283]/30 text-[#0B6E4F] px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {property.category.replace("_", " ")}
                </span>
                <span className="bg-slate-900 text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  For {property.intent === "buy" ? "Sale" : property.intent === "rent" ? "Rent" : "Lease"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight m-0 tracking-tight">
                {property.title}
              </h1>

              <div className="text-sm font-semibold text-slate-500 flex flex-wrap items-center gap-1.5">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span>
                  {[
                    property.location_address,
                    property.location_area,
                    property.location_city,
                    property.location_state,
                    property.location_pincode
                  ].filter(Boolean).join(", ")}
                </span>
              </div>

              {/* Owner Stats Badge */}
              {user && (user.role === "owner" || user.role === "agency") && user.id === property.owner_id && property.stats && (
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500 pt-1">
                  {property.stats.views !== undefined && (
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
                      <Eye className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <span className="text-slate-900 font-extrabold">{property.stats.views} Visits</span>
                    </span>
                  )}
                  {property.stats.enquiries !== undefined && (
                    <span className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                      <Mail className="h-3.5 w-3.5 text-[#0B6E4F] shrink-0" />
                      <span className="text-[#014645] font-extrabold">{property.stats.enquiries} Leads</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Pricing Widget (Visible on phone view directly under address) */}
            <div className="block lg:hidden my-2">
              <Card className="border border-slate-200/80 bg-white shadow-md rounded-2xl p-5 relative overflow-hidden space-y-4">
                {/* Header */}
                <div className="space-y-1 border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Property Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#0B6E4F]">
                      {formatPrice(property.price, property.price_unit)}
                    </span>
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Base Price:</span>
                    <span className="font-bold text-slate-800">{formatPrice(property.price, property.price_unit)}</span>
                  </div>
                  {property.deposit ? (
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span>Security Deposit:</span>
                      <span className="font-bold text-slate-800">₹{property.deposit.toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center pt-2 font-black text-sm text-slate-900 border-t border-slate-200/60">
                    <span>Estimated Total:</span>
                    <span className="text-base font-extrabold text-[#0B6E4F]">
                      {formatPrice(property.price + (property.deposit || 0), property.price_unit)}
                    </span>
                  </div>
                </div>

                {/* Room Sharing & Vacancy (PG/Hostel Only) */}
                {hasRoomSharing && <RoomSharingVacancy />}

                {/* Action Buttons */}
                <div className="pt-1">
                  <Button
                    onClick={handleWhatsAppContact}
                    className="w-full bg-[#23D283] hover:bg-[#11995E] text-white font-extrabold py-6 text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    <MessageSquare className="h-4.5 w-4.5" />
                    Chat on WhatsApp
                  </Button>
                </div>

                {/* Verified listing note */}
                <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 font-medium">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    High interest listing in {property.location_city}. Contact early to schedule a visit.
                  </span>
                </div>
              </Card>
            </div>

            {/* Key Specs Cards Grid */}
            {hasAnySpec && (
              <div className="flex flex-wrap sm:flex-nowrap sm:items-center gap-y-3 sm:gap-y-0 bg-white border border-slate-200/80 rounded-2xl p-4 sm:px-5 sm:py-4 shadow-2xs text-left">
                {hasBed && (
                  <div className={specCardClass}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bedroom</span>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <Bed className="h-4 w-4 text-[#0B6E4F] shrink-0" />
                      <span>{property.bedrooms} Bed</span>
                    </div>
                  </div>
                )}
                {hasBath && (
                  <div className={specCardClass}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bathroom</span>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <Bath className="h-4 w-4 text-[#0B6E4F] shrink-0" />
                      <span>{property.bathrooms} Bath</span>
                    </div>
                  </div>
                )}
                {hasArea && (
                  <div className={specCardClass}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Area</span>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <Maximize className="h-4 w-4 text-[#0B6E4F] shrink-0" />
                      <span>{Number(property.area).toLocaleString()} sqft</span>
                    </div>
                  </div>
                )}
                {hasFurnish && (
                  <div className={specCardClass}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Furnishing</span>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm capitalize">
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0">
                        <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full" />
                      </div>
                      <span>{property.furnishing}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Property Overview / Description */}
            <div className="space-y-3 pt-6 border-t border-slate-200/80">
              <h3 className="text-xl font-bold text-slate-900">About Property</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                {displayedDescription}
              </p>
              {isDescriptionLong && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[#0B6E4F] hover:text-[#23D283] text-xs font-bold underline cursor-pointer focus:outline-none transition-colors"
                >
                  {showFullDescription ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

            {/* Video Tours Section */}
            {validVideoLinks && validVideoLinks.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-200/80">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Play className="h-5 w-5 text-rose-600 fill-rose-600" /> Property Video Tours
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validVideoLinks.map((embedUrl: string, idx: number) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xs aspect-video bg-slate-900">
                      <iframe
                        src={embedUrl}
                        title={`Property Video Tour ${idx + 1}`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities Grid */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="space-y-3.5 pt-6 border-t border-slate-200/80">
                <h3 className="text-xl font-bold text-slate-900">Featured Amenities</h3>
                <div className="flex flex-wrap gap-2.5">
                  {property.amenities.map((amenity: string, index: number) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-2xs hover:border-[#23D283]/50 hover:bg-emerald-50/20 transition-all cursor-default"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#23D283] shrink-0" />
                      <span className="text-xs font-bold text-slate-800 capitalize">
                        {amenity.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Container */}
            <div className="space-y-4 pt-8 border-t border-slate-200/80">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500" /> Location Map
              </h3>
              {property.latitude && property.longitude ? (
                <div
                  ref={mapRef}
                  className="h-96 w-full rounded-2xl border border-slate-200/80 shadow-inner overflow-hidden relative z-10 bg-[#aad3df] [&_.leaflet-container]:bg-[#aad3df]!"
                  style={{ minHeight: '380px' }}
                />
              ) : (
                <div className="h-80 w-full bg-slate-100 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                  <HelpCircle className="h-8 w-8 text-slate-300" />
                  Coordinates not provided for this listing.
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="space-y-6 pt-10 border-t border-slate-200/80">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                Reviews & Ratings ({totalReviews})
              </h3>

              {/* Overall Score Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
                <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-100">
                  <span className="text-5xl font-black text-slate-900">{averageRating}</span>
                  <div className="my-2">
                    <RenderStars rating={Math.round(parseFloat(averageRating))} size={5} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col justify-center space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = starCounts[stars - 1];
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-600 w-3 text-right">{stars}</span>
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400 w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Form / Actions */}
              <div className="space-y-6">
                {user ? (
                  user.id === property.owner_id ? (
                    <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold text-slate-500">
                      Property owners or agencies cannot review their own listings.
                    </div>
                  ) : reviews.some((r) => r.user_id === user.id) ? (
                    <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 text-xs font-bold text-slate-500">
                      You have already reviewed this property. You can edit or delete your review below.
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                      <h4 className="text-base font-bold text-slate-900">Write a Review</h4>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Your Rating</label>
                        <RenderStars rating={newRating} interactive onChange={setNewRating} size={6} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Your Experience</label>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your feedback regarding location, neighborhood, and property condition..."
                          className="w-full min-h-24 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-sm focus:outline-none focus:border-[#23D283] transition-all resize-y font-semibold text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="bg-[#23D283] hover:bg-[#11995E] text-white font-extrabold px-6 py-2.5 text-xs rounded-xl flex items-center justify-center cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          {submitting ? "Submitting..." : "Submit Review"}
                        </Button>
                      </div>
                    </form>
                  )
                ) : (
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Have feedback on this property?</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">Sign in to share your experience with other seekers.</p>
                    </div>
                    <Button
                      onClick={() => setAuthModal({ open: true, mode: "login" })}
                      className="bg-[#23D283] hover:bg-[#11995E] text-white font-extrabold px-5 py-2 text-xs rounded-xl cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5"
                    >
                      ✏️ Write a Review
                    </Button>
                  </div>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="py-8 text-center text-slate-400 font-semibold text-sm">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-semibold text-sm bg-white rounded-2xl border border-slate-200/80">
                    No reviews yet. Be the first to write a review!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => {
                      const isOwnReview = user?.id === rev.user_id;
                      const isEditing = editingReviewId === rev.id;
                      const initial = (rev.user?.name || rev.reviewer_name || "U")[0].toUpperCase();

                      return (
                        <div key={rev.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 text-left">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-linear-to-tr from-[#014645] to-[#23D283] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner">
                                {initial}
                              </div>
                              <div>
                                <h5 className="text-sm font-extrabold text-slate-900">{rev.user?.name || rev.reviewer_name}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <RenderStars rating={rev.rating} size={3} />
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    {new Date(rev.created_at).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isOwnReview && !isEditing && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleStartEdit(rev)}
                                  className="p-1.5 text-slate-400 hover:text-[#0B6E4F] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit review"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete review"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 pt-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating</label>
                                <RenderStars rating={editRating} interactive onChange={setEditRating} size={5} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comment</label>
                                <textarea
                                  value={editComment}
                                  onChange={(e) => setEditComment(e.target.value)}
                                  className="w-full min-h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#23D283] transition-all resize-y font-semibold text-slate-800"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                                >
                                  Cancel
                                </button>
                                <Button
                                  onClick={() => handleUpdateReview(rev.id)}
                                  className="bg-[#23D283] hover:bg-[#11995E] text-white font-bold px-4 py-1.5 text-xs rounded-xl cursor-pointer shadow-2xs"
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-slate-600 leading-relaxed font-sans">
                              {rev.comment}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Sticky Sidebar: Price Card & Owner/Agency Info */}
          <div className="w-full lg:w-full shrink-0 sticky top-24 space-y-6">

            {/* Pricing & Contact Widget (Desktop sidebar) */}
            <Card className="hidden lg:block border border-slate-200/80 bg-white shadow-xl rounded-2xl p-6 relative overflow-hidden space-y-5">

              {/* Header */}
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Property Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#0B6E4F]">
                    {formatPrice(property.price, property.price_unit)}
                  </span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Base Price:</span>
                  <span className="font-bold text-slate-800">{formatPrice(property.price, property.price_unit)}</span>
                </div>
                {property.deposit ? (
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Security Deposit:</span>
                    <span className="font-bold text-slate-800">₹{property.deposit.toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center pt-2 font-black text-sm text-slate-900 border-t border-slate-200/60">
                  <span>Estimated Total:</span>
                  <span className="text-base font-extrabold text-[#0B6E4F]">
                    {formatPrice(property.price + (property.deposit || 0), property.price_unit)}
                  </span>
                </div>
              </div>

              {/* Room Sharing & Vacancy (PG/Hostel Only) */}
              {hasRoomSharing && <RoomSharingVacancy />}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleWhatsAppContact}
                  className="w-full bg-[#23D283] hover:bg-[#11995E] text-white font-extrabold py-7 text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  Chat on WhatsApp
                </Button>

              </div>

              {/* Verified listing note */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 font-medium">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  High interest listing in {property.location_city}. Contact early to schedule a visit.
                </span>
              </div>

            </Card>

            {/* Direct Owner or Agency Partner Card */}
            {property.owner_role === "agency" && agency ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-[#014645]/5 border border-slate-100 flex items-center justify-center text-[#014645] shrink-0 overflow-hidden relative shadow-2xs">
                    {agency.logo_key ? (
                      <img src={agency.logo_key} alt={agency.display_name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-7 w-7 text-[#23D283]" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider">Agency Partner</span>
                    <h4 className="text-base font-black text-slate-900 truncate leading-snug my-0">
                      {agency.display_name}
                    </h4>
                    {agency.verification_status === "verified" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Shield className="h-3 w-3 fill-emerald-500 text-white" /> Verified Agency
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <Link
                    to={`/agencies/${property.owner_id}`}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    View Agency Profile →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs text-left">
                <div className="p-3 rounded-2xl bg-[#23D283]/10 text-[#0B6E4F]">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-slate-900">Direct Owner Listing</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Zero Brokerage Commission</p>
                </div>
              </div>
            )}

          </div>

          {/* Related Properties */}
          {relatedProperties.length > 0 && (
            <div className="lg:col-span-3 space-y-6 pt-10 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900">Similar Properties Nearby</h3>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-xs font-bold text-[#0B6E4F] hover:text-[#23D283] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                {relatedProperties.map((related) => (
                  <Card
                    key={related.id}
                    onClick={() => {
                      navigate(propertyPath(related));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="border border-slate-200/80 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col group p-3.5 rounded-2xl cursor-pointer text-left"
                  >
                    {/* Image box */}
                    <div className="h-44 w-full rounded-xl overflow-hidden relative shrink-0">
                      {related.photos && related.photos.length > 0 ? (
                        <img
                          src={related.photos[0]}
                          alt={related.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-800 flex flex-col items-center justify-center text-slate-400 gap-1">
                          <Building2 className="h-8 w-8 text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-400">No Image Available</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex rounded-md bg-white/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-black text-slate-800 shadow-2xs uppercase tracking-wider">
                          For {related.intent === "buy" ? "Sale" : related.intent === "rent" ? "Rent" : "Lease"}
                        </span>
                      </div>
                    </div>

                    <div className="pb-1 px-1 pt-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                          <span className="truncate">{related.location_area}, {related.location_city}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1 pt-1 group-hover:text-[#0B6E4F] transition-colors leading-tight">
                          {related.title}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-3">
                        <span className="font-black text-sm text-[#0B6E4F]">
                          {formatPrice(related.price, related.price_unit)}
                        </span>
                        <span className="text-[10px] font-bold text-[#23D283] flex items-center gap-0.5">
                          View Listing <span className="font-mono">→</span>
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: "login" })}
        />
      )}

      {/* Detailed Image Viewer Modal */}
      {isImageViewerOpen && mediaList.length > 0 && (
        <div className="fixed inset-0 z-9999 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 backdrop-blur-sm transition-all duration-300">
          <button
            onClick={() => setIsImageViewerOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors cursor-pointer z-50 border border-white/10"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {mediaList[activePhotoIndex]?.type === "video" ? (
              <iframe
                src={mediaList[activePhotoIndex].url}
                title="Property Video Tour"
                className="w-full h-full max-w-5xl max-h-[80vh] border-0 rounded-2xl shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                src={mediaList[activePhotoIndex]?.url}
                alt={`${property.title} - View ${activePhotoIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
              />
            )}

            {mediaList.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPhoto();
                  }}
                  className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-all shadow-md cursor-pointer border border-white/10 hover:scale-110 active:scale-95"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                  }}
                  className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-all shadow-md cursor-pointer border border-white/10 hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 sm:bottom-8 text-white/90 text-sm font-extrabold bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              {activePhotoIndex + 1} / {mediaList.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
