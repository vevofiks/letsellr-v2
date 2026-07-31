import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Building2, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  MapPin, 
  Lock, 
  Image as ImageIcon, 
  Info,
  ArrowLeft,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Navigation,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OwnerNavbar } from "@/components/OwnerNavbar";
import { toast } from "sonner";
import { api } from "@/lib/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const AMENITIES_LIST = [
  "Wifi",
  "Air Conditioning",
  "Parking",
  "Power Backup",
  "24x7 Security",
  "Elevator / Lift",
  "Food & Mess",
  "Washing Machine / Laundry",
  "Housekeeping",
  "Water Purifier",
  "Gym",
  "CCTV Surveillance",
  "Swimming Pool",
  "Furnished Rooms"
];

export const OwnerPropertyFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId?: string }>();

  const isEdit = Boolean(propertyId);
  const isOwner = user?.role === "owner";

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [intent, setIntent] = useState<"rent" | "buy" | "lease">("rent");
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  
  const [price, setPrice] = useState<number | "">("");
  const [priceUnit, setPriceUnit] = useState<"per_month" | "total">("per_month");

  const [area, setArea] = useState<number | "">("");
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [furnishing, setFurnishing] = useState<"unfurnished" | "semi" | "furnished">("semi");

  const [address, setAddress] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("682030");
  const [state, setState] = useState("Kerala");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");

  const [amenities, setAmenities] = useState<string[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<string[]>(AMENITIES_LIST);
  const [customAmenity, setCustomAmenity] = useState("");
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);

  const [availabilityStatus, setAvailabilityStatus] = useState<"available" | "occupied" | "upcoming">("available");
  const [availableFrom, setAvailableFrom] = useState("");
  const [existingStatus, setExistingStatus] = useState<string>("");

  // Accordion open/close state
  const [specsOpen, setSpecsOpen] = useState(false);

  // Map and Search states
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Geolocation logic to get user current location automatically (if not editing)
  useEffect(() => {
    if (!isEdit && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
        },
        (error) => {
          console.warn("Auto-geolocation access denied or failed:", error);
        }
      );
    }
  }, [isEdit]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (loading || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    // Fix default icons path
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    const initialLat = latitude !== "" ? Number(latitude) : 10.0159;
    const initialLng = longitude !== "" ? Number(longitude) : 76.3419;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      maxZoom: 18,
    }).setView([initialLat, initialLng], latitude !== "" ? 15 : 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map);

    // Track dragging
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      setLatitude(position.lat);
      setLongitude(position.lng);
    });

    // Track map click to reposition marker
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerInstanceRef.current = null;
    };
  }, [loading]);

  // Update map marker when latitude/longitude values change externally (e.g. from fetched property or search)
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current && latitude !== "" && longitude !== "") {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const currentPos = markerInstanceRef.current.getLatLng();
      
      // Pan to new coordinate only if the shift is substantial
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerInstanceRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 15);
      }
      mapInstanceRef.current.invalidateSize();
    }
  }, [latitude, longitude]);

  // Handle Search submit
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(mapSearchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data);
      if (data.length === 0) {
        toast.error("No locations found for your search.");
      }
    } catch (err) {
      console.error("Nominatim search failed:", err);
      toast.error("Location search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle suggestion select
  const handleSelectSearchResult = (result: any) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    setLatitude(lat);
    setLongitude(lng);
    setSearchResults([]);
    setMapSearchQuery(result.display_name);

    // Auto-fill address details
    if (result.address) {
      const cityVal = result.address.city || result.address.town || result.address.village || result.address.county || "";
      const stateVal = result.address.state || "";
      let areaVal = result.address.suburb || result.address.neighbourhood || result.address.residential || result.address.quarter || result.address.hamlet || result.address.city_district || "";
      
      // If we couldn't find a specific area, try to use the primary name of the location
      if (!areaVal && result.name && result.name !== cityVal && result.name !== stateVal) {
        areaVal = result.name;
      }
      
      // Ultimate fallback: take the first part of display_name
      if (!areaVal && result.display_name) {
        areaVal = result.display_name.split(",")[0].trim();
      }

      if (cityVal) setCity(cityVal);
      if (stateVal) setState(stateVal);
      if (areaVal) setLocationArea(areaVal);
    }
    toast.success("Location updated on map.");
  };

  // Handle Use Current Location button click
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setSearchLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setSearchLoading(false);
        toast.success("Marker moved to your current location.");

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data && data.address) {
            const cityVal = data.address.city || data.address.town || data.address.village || data.address.county || "";
            const stateVal = data.address.state || "";
            let areaVal = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.quarter || data.address.hamlet || data.address.city_district || "";
            
            if (!areaVal && data.name && data.name !== cityVal && data.name !== stateVal) {
              areaVal = data.name;
            }
            
            if (!areaVal && data.display_name) {
              areaVal = data.display_name.split(",")[0].trim();
            }

            if (cityVal) setCity(cityVal);
            if (stateVal) setState(stateVal);
            if (areaVal) setLocationArea(areaVal);
            if (data.display_name) setMapSearchQuery(data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }
      },
      (error) => {
        setSearchLoading(false);
        console.error("Geolocation failed:", error);
        toast.error("Unable to retrieve your current location. Please verify browser permissions.");
      }
    );
  };

  const fetchExistingProperty = React.useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/properties/${id}`);
      const data = res.data;

      setTitle(data.title || "");
      setDescription(data.description || "");
      setCategory(data.category || "");
      setIntent(data.intent || "rent");
      setPrice(data.price || "");
      setPriceUnit(data.price_unit || "per_month");
      setArea(data.area || "");
      setBedrooms(data.bedrooms || "");
      setBathrooms(data.bathrooms || "");
      setFurnishing(data.furnishing || "semi");
      
      setAddress(data.location_address || "");
      setLocationArea(data.location_area || "");
      setCity(data.location_city || "");
      setPincode(data.location_pincode || "");
      setState(data.location_state || "Kerala");
      setLatitude(data.latitude || "");
      setLongitude(data.longitude || "");

      const fetchedAmenities = data.amenities || [];
      setAmenities(fetchedAmenities);
      setAvailableAmenities((prev) => {
        const merged = [...prev];
        fetchedAmenities.forEach((item: string) => {
          if (!merged.includes(item)) merged.push(item);
        });
        return merged;
      });

      setPhotos(data.photos && data.photos.length > 0 ? data.photos : []);
      setExistingStatus(data.status || "");

      if (data.extra_details) {
        setAvailabilityStatus(data.extra_details.availability_status || "available");
        setAvailableFrom(data.extra_details.available_from || "");
      } else {
        setAvailabilityStatus("available");
        setAvailableFrom("");
      }
    } catch (err) {
      console.error("Failed to load property details", err);
      toast.error("Property not found or access denied.");
      navigate("/owner/properties");
    } finally {
      setLoading(false);
    }
  }, [isOwner, navigate]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/api/properties/config/types");
        const types = res.data;
        setPropertyTypes(types);
        
        // Filter types based on user role
        const userRole = user?.role || "owner";
        const allowedTypes = types.filter((t: any) => t.allowed_roles.includes(userRole));
        
        // If not editing and we have allowed types, default to the first one
        if (!isEdit && allowedTypes.length > 0 && !category) {
          setCategory(allowedTypes[0].slug);
        }
      } catch (err) {
        console.error("Failed to load property types", err);
      }
    };
    
    fetchConfig();
  }, [user?.role, isEdit, category]);

  useEffect(() => {
    if (isEdit && propertyId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchExistingProperty(propertyId);
    }
  }, [isEdit, propertyId, fetchExistingProperty]);

  const handleToggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + newFiles.length + files.length > 10) {
      toast.error("Maximum 10 photos allowed.");
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 2MB.`);
      } else {
        validFiles.push(file);
        validPreviews.push(URL.createObjectURL(file));
      }
    });

    if (validFiles.length > 0) {
      setNewFiles(prev => [...prev, ...validFiles]);
      setNewFilePreviews(prev => [...prev, ...validPreviews]);
    }
    
    e.target.value = "";
  };

  const handleRemoveExistingPhoto = async (index: number) => {
    const urlToRemove = photos[index];
    
    // Optimistically remove from UI
    setPhotos(photos.filter((_, i) => i !== index));

    if (urlToRemove) {
      try {
        await api.post("/api/media/delete", { url: urlToRemove });
        toast.success("Photo removed from storage.");
      } catch (err) {
        console.error("Failed to delete photo from storage", err);
      }
    }
  };

  const handleRemoveNewPhoto = (index: number) => {
    const previewToRevoke = newFilePreviews[index];
    if (previewToRevoke) URL.revokeObjectURL(previewToRevoke);
    
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewFilePreviews(newFilePreviews.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (targetStatus: "draft" | "pending_review") => {
    if (!title.trim()) {
      toast.error("Property title is required.");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Valid price is required.");
      return;
    }
    if (!locationArea.trim() || !city.trim()) {
      toast.error("Area and City location fields are required.");
      return;
    }
    if (photos.length + newFiles.length === 0) {
      toast.error("At least one photo upload is required.");
      return;
    }

    const phoneValue = user?.phone || "";

    try {
      setSubmitting(true);

      // Upload new files first
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "uploads");
          try {
            const res = await api.post("/api/media/upload", formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
            return res.data.url;
          } catch (err) {
            console.error("Upload failed for", file.name, err);
            toast.error(`Failed to upload ${file.name}`);
            return null;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.filter((url): url is string => Boolean(url));
      }

      const finalPhotos = [...photos, ...uploadedUrls];

      const payload = {
        category,
        intent,
        title: title.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        price_unit: priceUnit,
        area: area ? Number(area) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        furnishing,
        amenities,
        photos: finalPhotos,
        extra_details: {
          availability_status: availabilityStatus,
          available_from: availableFrom || undefined
        },
        location: {
          address: address.trim() || undefined,
          area: locationArea.trim(),
          city: city.trim(),
          pincode: pincode.trim() || "682030",
          state: state.trim(),
          latitude: latitude !== "" ? Number(latitude) : undefined,
          longitude: longitude !== "" ? Number(longitude) : undefined,
        },
        owner_phone: phoneValue.trim(),
        owner_whatsapp: phoneValue.trim() || undefined,
        status: targetStatus,
      };

      if (isEdit && propertyId) {
        await api.patch(`/api/properties/${propertyId}`, payload);
        toast.success(
          targetStatus === "draft"
            ? "Property saved as draft."
            : "Property updated and submitted for review!"
        );
      } else {
        await api.post("/api/properties", payload);
        toast.success(
          targetStatus === "draft"
            ? "Property listing saved as draft."
            : "Property listing submitted for review!"
        );
      }

      navigate("/owner/properties");
    } catch (err: unknown) {
      console.error("Property submission failed", err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      toast.error(apiErr.response?.data?.detail || "Failed to save property listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <OwnerNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex items-center justify-center h-20 w-20">
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-[#014645] animate-spin" />
              <img 
                src="/logo.png" 
                alt="Letsellr Logo" 
                className="h-9 w-auto z-10 animate-pulse" 
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-450 animate-pulse">
              Loading form details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const showAvailability = isEdit && existingStatus === "live";

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans pb-12 text-slate-900">
      <OwnerNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/owner/properties")}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-md transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Properties
          </button>

          <span className="text-xs font-extrabold text-slate-400">
            {isEdit ? "Edit Listing" : "New Property Listing"}
          </span>
        </div>

        {/* Header Title Banner */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-2 text-left">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight my-0">
            {isEdit ? "Edit Property Listing" : "Post a New Property Listing"}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Fill in the details below. Listings submitted for review will be reviewed by admin before going live.
          </p>
        </div>

        {/* Section 1: Basic Information */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-5 text-left">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            <Building2 className="h-5 w-5 text-brand-green" /> Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category selection */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Property Category</span>
                {isOwner && (
                  <span className="text-[10px] text-brand-green font-black flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Restricted
                  </span>
                )}
              </label>

              <div className="space-y-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-green/20 ${isOwner && propertyTypes.filter((t: any) => t.allowed_roles.includes("owner")).length <= 1 ? 'cursor-not-allowed bg-slate-100' : ''}`}
                  disabled={isOwner && propertyTypes.filter((t: any) => t.allowed_roles.includes("owner")).length <= 1}
                >
                  {propertyTypes.length > 0 ? (
                    propertyTypes
                      .filter((t: any) => t.allowed_roles.includes(user?.role || "owner"))
                      .map((t: any) => (
                        <option key={t.id} value={t.slug}>
                          {t.label}
                        </option>
                      ))
                  ) : (
                    <option value="">Loading categories...</option>
                  )}
                </select>
                {isOwner && (
                  <p className="text-[10px] font-medium bg-emerald-50/70 text-emerald-800 p-2 rounded-lg border border-emerald-100">
                    <Info className="h-3 w-3 inline mr-1" />
                    Individual self-listing owners are restricted to specific property categories.
                  </p>
                )}
              </div>
            </div>

            {/* Listing Intent */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700">Listing Intent</label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as "rent" | "buy" | "lease")}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="rent">For Rent</option>
                <option value="buy">For Sale</option>
                <option value="lease">For Lease</option>
              </select>
            </div>

            {/* Property Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Listing Title *</label>
              <input
                type="text"
                placeholder="e.g. Luxury 2 BHK Apartment near InfoPark, Kakkanad"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/20"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Detailed Description</label>
              <textarea
                rows={3}
                placeholder="Describe key features, house rules, nearby landmarks, or highlights..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Pricing */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-5 text-left">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            ₹ Pricing & Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Price (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Price Unit</label>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value as "per_month" | "total")}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="per_month">Per Month</option>
                <option value="total">Total Price</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section 3: Specs & Features - ACCORDION LAYOUT */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs text-left">
          <button
            type="button"
            onClick={() => setSpecsOpen(!specsOpen)}
            className="w-full flex items-center justify-between text-base font-bold text-slate-900 border-0 bg-transparent p-0 cursor-pointer focus:outline-none"
          >
            <span className="flex items-center gap-2">Property Specifications</span>
            {specsOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
          </button>

          {specsOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 animate-in fade-in duration-200">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Area (sq ft) (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 1200"
                  value={area}
                  onChange={(e) => setArea(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bedrooms</label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bathrooms</label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Furnishing</label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as "unfurnished" | "semi" | "furnished")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="semi">Semi-Furnished</option>
                  <option value="furnished">Fully Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>

            </div>
          )}
        </div>

        {/* Section 4: Availability & Status (Shown ONLY if listing is edit mode + already live) */}
        {showAvailability && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-5 text-left">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
              <Calendar className="h-5 w-5 text-brand-green" /> Availability Status
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Current Occupancy/Availability</label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as "available" | "occupied" | "upcoming")}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-green/20"
                >
                  <option value="available">Available Now</option>
                  <option value="upcoming">Upcoming / Available Soon</option>
                  <option value="occupied">Occupied (No Vacancy)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Available From (Optional)</label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900"
                />
              </div>
              
            </div>
          </div>
        )}

        {/* Section 5: Location */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-5 text-left">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            <MapPin className="h-5 w-5 text-brand-green" /> Location Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-bold text-slate-700">Address / Building Name</label>
              <input
                type="text"
                placeholder="e.g. Flat 4B, Skyline Ivy League, Seaport Airport Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Area / Locality *</label>
              <input
                type="text"
                placeholder="e.g. Kakkanad"
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-brand-green/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">City *</label>
              <input
                type="text"
                placeholder="e.g. Kochi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-brand-green/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

          </div>

          {/* Interactive Location Map Redesign */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-black text-slate-900 block">Pin Exact Property Location</label>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Drag the marker or search to locate the property</p>
              </div>

              {/* Current location button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={searchLoading}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer border-0 h-9 disabled:opacity-50"
              >
                {searchLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 text-brand-green" />
                )}
                Use Current Location
              </button>
            </div>

            {/* Address Search Bar */}
            <form onSubmit={handleMapSearch} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for building, locality, or address..."
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all border-0 cursor-pointer h-9"
              >
                {searchLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>

              {/* Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green transition-colors block border-0 bg-transparent cursor-pointer"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Map Canvas */}
            <div 
              ref={mapRef} 
              className="h-75 w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative z-10" 
              style={{ minHeight: '320px' }}
            />
          </div>
        </div>

        {/* Section 6: Amenities & Facilities */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4 text-left">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            Amenities & Facilities
          </h2>

          <div className="flex flex-wrap gap-2">
            {availableAmenities.map((item) => {
              const selected = amenities.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => handleToggleAmenity(item)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? "bg-emerald-50 border-brand-green text-brand-green"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {item}
                </button>
              );
            })}
          </div>

          {/* Add custom tag */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 max-w-sm">
            <input
              type="text"
              placeholder="Add custom amenity..."
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
            />
            <button
              type="button"
              onClick={() => {
                const val = customAmenity.trim();
                if (val) {
                  if (!availableAmenities.includes(val)) {
                    setAvailableAmenities((prev) => [...prev, val]);
                  }
                  if (!amenities.includes(val)) {
                    setAmenities((prev) => [...prev, val]);
                  }
                  setCustomAmenity("");
                }
              }}
              className="bg-brand-green border-0 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-brand-green-hover transition-colors h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Section 7: Photos Upload from Storage only */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-5 text-left">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
            <ImageIcon className="h-5 w-5 text-brand-green" /> Photos
          </h2>

          <div className="space-y-4">
            <input
              type="file"
              id="property-file-input"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            <div>
              <label
                htmlFor="property-file-input"
                className="inline-flex bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-4 py-2.5 rounded-md items-center gap-1.5 cursor-pointer shadow-sm transition-all h-10"
              >
                <Plus className="h-4 w-4" /> Upload Photos from Storage
              </label>
              <p className="text-[10px] text-slate-400 font-semibold mt-1.5">
                You can upload multiple image files (JPEG, PNG). Max 10 photos.
              </p>
            </div>

            {/* Photo Previews (Existing) */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative group rounded-md overflow-hidden border border-slate-200 h-24">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-90 hover:opacity-100 transition-opacity border-0 cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Photo Previews (New pending upload) */}
            {newFilePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {newFilePreviews.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative group rounded-md overflow-hidden border border-slate-200 h-24">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewPhoto(idx)}
                      disabled={submitting}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-90 hover:opacity-100 transition-opacity border-0 cursor-pointer disabled:opacity-50"
                      title="Remove Photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {submitting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="h-6 w-6 text-brand-green animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Form Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmitForm("draft")}
            className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs px-6 py-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 border-0 h-10"
          >
            <Save className="h-4 w-4" /> Save as Draft
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmitForm("pending_review")}
            className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs px-8 py-3 rounded-md flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 border-0 h-10"
          >
            <Send className="h-4 w-4" /> {isEdit ? "Update & Submit for Review" : "Submit Property for Review"}
          </button>
        </div>

      </main>
    </div>
  );
};
