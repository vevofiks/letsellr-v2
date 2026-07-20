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
  Shield,
  Play,
  Eye,
  Mail,
  Star,
  Trash2,
  Edit3
} from "lucide-react";

const getYoutubeEmbedUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
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
  const { user } = useAuth();
  
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProperties, setRelatedProperties] = useState<any[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

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
      navigate("/login", { state: { from: `/properties/${propertyId}` } });
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
      const msg = error.response?.data?.detail || "Failed to submit review";
      toast.error(msg);
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
      const msg = error.response?.data?.detail || "Failed to update review";
      toast.error(msg);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await api.delete(`/api/reviews/${reviewId}`);
      toast.success("Review deleted successfully!");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to delete review";
      toast.error(msg);
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
            className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-all ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }`}
            style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
          />
        ))}
      </div>
    );
  };

  const photosGrid = property ? getPhotosGrid(property.photos, property.category) : [];

  const mediaList = React.useMemo(() => {
    if (!property) return [];
    const list: { type: "image" | "video"; url: string }[] = [];
    const embedUrl = getYoutubeEmbedUrl(property.video_link);
    if (embedUrl) {
      list.push({ type: "video", url: embedUrl });
    }
    photosGrid.forEach((img) => {
      list.push({ type: "image", url: img });
    });
    return list;
  }, [property, photosGrid]);

  const handleNextPhoto = () => {
    if (mediaList.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevPhoto = () => {
    if (mediaList.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
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
        attributionControl: false,
        maxZoom: 13,
      }).setView([property.latitude, property.longitude], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 13,
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
          <div className="h-10 w-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Side: Media Grid, Specs, Description, Map */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Premium Interactive Image Carousel with Left-aligned Back Icon */}
            <div className="flex items-start gap-4">
              {/* Circular Back button on the left of carousel (Desktop only) */}
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-brand-green hover:text-brand-green-hover transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer mt-1"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* Carousel wrapper */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="relative h-75 sm:h-120 w-full overflow-hidden rounded-[24px] bg-slate-900 border border-slate-100 shadow-md group">
                  {/* Floating Back button (Mobile only) */}
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="absolute top-4 left-4 z-20 md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white/95 hover:bg-white backdrop-blur-sm text-brand-green hover:text-brand-green-hover transition-all shadow-md active:scale-95 cursor-pointer border border-slate-100"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {/* Active Slide */}
                  {mediaList[activePhotoIndex]?.type === "video" ? (
                    <iframe
                      src={mediaList[activePhotoIndex].url}
                      title="Property Video Tour"
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img 
                      src={mediaList[activePhotoIndex]?.url} 
                      alt={`${property.title} - View ${activePhotoIndex + 1}`} 
                      className="h-full w-full object-cover transition-all duration-500 ease-in-out"
                    />
                  )}

                  {/* Left/Right floating chevrons */}
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-sm text-brand-green hover:text-brand-green-hover transition-all shadow-md cursor-pointer opacity-0 group-hover:opacity-100 border border-slate-100"
                    aria-label="Previous image"
                  >
                    <svg className="h-6 w-6 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-sm text-brand-green hover:text-brand-green-hover transition-all shadow-md cursor-pointer opacity-0 group-hover:opacity-100 border border-slate-100"
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
                    {activePhotoIndex + 1} / {mediaList.length}
                  </div>
                </div>

                {/* Thumbnails indicator row */}
                {mediaList.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 max-w-full justify-center scrollbar-none">
                    {mediaList.map((media, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIndex(i)}
                        className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 cursor-pointer ${
                          i === activePhotoIndex ? "border-brand-green scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        {media.type === "video" ? (
                          <div className="relative h-full w-full bg-slate-900">
                            <img src={getYoutubeThumbnailUrl(property.video_link) || photosGrid[0]} alt="" className="h-full w-full object-cover opacity-50" />
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
            </div>

            {/* Title & Info Block */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-teal-50 border border-teal-100 text-brand-green px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  {property.category.replace("_", " ")}
                </span>
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  For {property.intent === "buy" ? "Sale" : property.intent === "rent" ? "Rent" : "Lease"}
                </span>
                {property.status && property.status !== "active" && (
                  <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    {property.status}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-black text-slate-900 leading-tight m-0">
                {property.title}
              </h1>
              
              <div className="text-sm font-medium text-slate-500 flex flex-wrap items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-green shrink-0" />
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

              {/* Stats Block */}
              {property.stats && (
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-1">
                  {property.stats.views !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{property.stats.views} Views</span>
                    </span>
                  )}
                  {property.stats.enquiries !== undefined && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{property.stats.enquiries} Enquiries</span>
                    </span>
                  )}
                </div>
              )}
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
                  <div className="h-1.5 w-6 rounded bg-brand-green" />
                  <div className="h-1.5 w-6 rounded bg-brand-green" />
                  <div className="h-1.5 w-6 rounded bg-brand-green" />
                  <div className="h-1.5 w-6 rounded bg-brand-green" />
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
                  className="text-brand-green hover:text-brand-green-hover text-xs font-bold underline cursor-pointer focus:outline-none"
                >
                  {showFullDescription ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm hover:shadow transition-shadow">
                      <div className="h-2 w-2 rounded-full bg-brand-green" />
                      <span className="text-xs font-semibold text-slate-700 capitalize">
                        {amenity.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Cost widget and contact details */}
          <div className="lg:col-span-1 lg:row-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
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
                <span className="text-3xl font-black text-brand-green">
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
                <span className="text-base font-black text-brand-green">
                  {formatPrice(property.price + (property.deposit || 0), property.price_unit)}
                </span>
              </div>

              {/* Action Button: WhatsApp primary */}
              <div className="mt-5 space-y-3">
                <Button
                  onClick={handleWhatsAppContact}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-extrabold py-4 text-sm rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-900/10"
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
              <div className="p-2 rounded-xl bg-teal-50 text-brand-green">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-slate-900">Direct Owner Listing</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Broker commission</p>
              </div>
            </div>

          </div>

          {/* Map Container */}
          <div className="lg:col-span-2 space-y-3 pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="h-5 w-5 text-brand-green" /> Location Map
            </h3>
            {property.latitude && property.longitude ? (
              <div 
                ref={mapRef} 
                className="h-100 w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative z-10" 
                style={{ minHeight: '400px' }}
              />
            ) : (
              <div className="h-100 w-full bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-sm gap-2" style={{ minHeight: '400px' }}>
                <HelpCircle className="h-8 w-8 text-slate-300" />
                Coordinates not provided for this listing.
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="lg:col-span-2 space-y-6 pt-10 border-t border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
              Reviews ({totalReviews})
            </h3>

            {/* Overall stats and progress bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
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
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
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

            {/* Reviews List & Write Review container */}
            <div className="space-y-6">
              {/* Write Review Form */}
              {user ? (
                user.id === property.owner_id ? (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-sm text-slate-500 font-medium">
                    Property owners/agents cannot write reviews for their own listings.
                  </div>
                ) : reviews.some((r) => r.user_id === user.id) ? (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-sm text-slate-500 font-medium">
                    You have already submitted a review for this property. You can edit or delete your existing review below.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-slate-900 font-sans">Write a Review</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Rating</label>
                      <RenderStars rating={newRating} interactive onChange={setNewRating} size={6} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Comment</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your detailed experience with this property and location..."
                        className="w-full min-h-25 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-green transition-all resize-y font-sans font-semibold text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold px-6 py-2.5 text-xs rounded-full flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                )
              ) : (
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Logged in users can write reviews</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Please sign in to share your experience with this listing.</p>
                  </div>
                  <Button
                    onClick={() => navigate("/login", { state: { from: `/properties/${propertyId}` } })}
                    className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold px-5 py-2 text-xs rounded-full cursor-pointer shrink-0 shadow-sm"
                  >
                    Sign In
                  </Button>
                </div>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="py-8 text-center text-slate-400 font-semibold text-sm">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-semibold text-sm bg-slate-50 rounded-2xl border border-slate-100">
                  No reviews yet. Be the first to review this property!
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => {
                    const isOwnReview = user?.id === rev.user_id;
                    const isEditing = editingReviewId === rev.id;
                    const initial = (rev.user?.name || rev.reviewer_name || "U")[0].toUpperCase();

                    return (
                      <div key={rev.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 text-left">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-linear-to-tr from-brand-green to-[#2e5d45] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner">
                              {initial}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-slate-900">{rev.user?.name || rev.reviewer_name}</h5>
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
                                className="p-2 text-slate-400 hover:text-brand-green hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
                                title="Edit review"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                                title="Delete review"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating</label>
                              <RenderStars rating={editRating} interactive onChange={setEditRating} size={5} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comment</label>
                              <textarea
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                className="w-full min-h-20 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-brand-green transition-all resize-y font-semibold text-slate-800"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs rounded-full cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                              <Button
                                onClick={() => handleUpdateReview(rev.id)}
                                className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold px-4 py-2 text-xs rounded-full cursor-pointer shadow-sm"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-slate-600 leading-relaxed pl-1 font-sans">
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

          {/* Related Properties row */}
          {relatedProperties.length > 0 && (
            <div className="lg:col-span-2 space-y-6 pt-10 border-t border-slate-100">
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
                        <h4 className="text-sm font-semibold text-slate-950 line-clamp-1 pt-0.5 group-hover:text-brand-green transition-colors leading-tight">
                          {related.title}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2.5">
                        <span className="font-extrabold text-sm text-slate-950">
                          {formatPrice(related.price, related.price_unit)}
                        </span>
                        <span className="text-[10px] font-bold text-brand-green flex items-center gap-0.5">
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
      </main>

    </div>
  );
};
