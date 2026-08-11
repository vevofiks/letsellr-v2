import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Pencil,
  ExternalLink,
  Save,
  Building2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Navigation,
  Loader2,
  ChevronDown,
  ChevronUp,
  Phone,
  User as UserIcon,
  Calendar,
  Sparkles,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { adminService, type AdminProperty, type PropertyReview } from "@/services/adminService";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ConfirmDialogProvider";

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
  "Furnished Rooms",
];

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const getPhotoUrl = (photo: unknown): string => {
  if (!photo) return "";
  if (typeof photo === "string") return photo;
  if (typeof photo === "object" && photo !== null) {
    const p = photo as Record<string, any>;
    return p.photo_url || p.url || p.src || "";
  }
  return "";
};

const getCategoryFallbackImage = (cat: string) => {
  const c = (cat || "").toLowerCase();
  if (c.includes("apartment") || c.includes("flat")) {
    return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
  }
  if (c.includes("villa") || c.includes("house")) {
    return "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80";
  }
  if (c.includes("pg") || c.includes("hostel")) {
    return "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
  }
  if (c.includes("land") || c.includes("plot")) {
    return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80";
};

export const AdminPropertiesQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Tabs: "pending" | "live"
  const [activeTab, setActiveTab] = useState<"pending" | "live">("pending");

  // Dual state management
  const [pendingProperties, setPendingProperties] = useState<AdminProperty[]>([]);
  const [liveProperties, setLiveProperties] = useState<AdminProperty[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");

  // Modals state
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);

  // Property Reviews state
  const [propertyReviews, setPropertyReviews] = useState<PropertyReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const fetchPropertyReviews = async (propertyId: string) => {
    try {
      setLoadingReviews(true);
      const data = await adminService.getPropertyReviews(propertyId);
      setPropertyReviews(data || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setPropertyReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const isConfirmed = await confirm({
      title: "Delete Review",
      description: "Are you sure you want to delete this user review?",
      variant: "destructive"
    });
    if (!isConfirmed) return;
    try {
      setDeletingReviewId(reviewId);
      await adminService.deletePropertyReview(reviewId);
      setPropertyReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted successfully!");
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to delete review."));
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Approval/Rejection input state
  const [approveReason, setApproveReason] = useState("Meets all listing standards & verified");
  const [rejectReason, setRejectReason] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ── ADMIN EDIT PROPERTY MODAL STATE ──
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<AdminProperty | null>(null);

  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("apartment");
  const [editIntent, setEditIntent] = useState<string>("rent");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editPriceUnit, setEditPriceUnit] = useState<string>("per_month");
  const [editDeposit, setEditDeposit] = useState<number | "">("");
  const [editBedrooms, setEditBedrooms] = useState<number | "">("");
  const [editBathrooms, setEditBathrooms] = useState<number | "">("");
  const [editArea, setEditArea] = useState<number | "">("");
  const [editFurnishing, setEditFurnishing] = useState<string>("semi");

  // Location fields
  const [editAddress, setEditAddress] = useState<string>("");
  const [editAreaLocation, setEditAreaLocation] = useState<string>("");
  const [editCity, setEditCity] = useState<string>("");
  const [editPincode, setEditPincode] = useState<string>("");
  const [editState, setEditState] = useState<string>("");
  const [editLatitude, setEditLatitude] = useState<number | "">("");
  const [editLongitude, setEditLongitude] = useState<number | "">("");

  // Amenities & Photos
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<string[]>(AMENITIES_LIST);
  const [customAmenityInput, setCustomAmenityInput] = useState<string>("");

  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState<string>("");
  const [editVideoLinks, setEditVideoLinks] = useState<string[]>([]);
  const [newVideoLinkInput, setNewVideoLinkInput] = useState<string>("");
  const [specsOpen, setSpecsOpen] = useState<boolean>(true);
  const [editSaving, setEditSaving] = useState<boolean>(false);

  const [editRoomSharingOptions, setEditRoomSharingOptions] = useState<Array<{ sharing: number | ""; price: number | ""; vacancy: number | "" }>>([]);

  const addEditRoomSharingOption = () => {
    setEditRoomSharingOptions([...editRoomSharingOptions, { sharing: "", price: "", vacancy: "" }]);
  };

  const updateEditRoomSharingOption = (index: number, field: "sharing" | "price" | "vacancy", value: number | "") => {
    const newOptions = [...editRoomSharingOptions];
    newOptions[index][field] = value;
    setEditRoomSharingOptions(newOptions);
  };

  const removeEditRoomSharingOption = (index: number) => {
    setEditRoomSharingOptions(editRoomSharingOptions.filter((_, i) => i !== index));
  };

  // Map & Search states for edit modal
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch both pending & live properties simultaneously
  const fetchProperties = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [pendingData, liveData, typesRes] = await Promise.all([
        adminService.getPendingProperties(),
        adminService.getLiveProperties(),
        api.get("/api/properties/config/types").catch(() => ({ data: [] }))
      ]);

      setPendingProperties(pendingData || []);
      setLiveProperties(liveData || []);
      if (typesRes && typesRes.data) {
        setPropertyTypes(typesRes.data);
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to load properties queue."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // ── LEAFLET MAP INITIALIZATION FOR EDIT MODAL ──
  useEffect(() => {
    if (!editModalOpen || !mapRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    const initialLat = editLatitude !== "" ? Number(editLatitude) : 10.0159;
    const initialLng = editLongitude !== "" ? Number(editLongitude) : 76.3419;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([initialLat, initialLng], editLatitude !== "" ? 15 : 12);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([initialLat, initialLng]);
      }
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
      return;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      minZoom: 5,
      maxZoom: 18,
      worldCopyJump: true,
    }).setView([initialLat, initialLng], editLatitude !== "" ? 15 : 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 5,
      maxZoom: 18,
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setEditLatitude(pos.lat);
      setEditLongitude(pos.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setEditLatitude(e.latlng.lat);
      setEditLongitude(e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [editModalOpen, editLatitude, editLongitude]);

  // Update map marker when latitude/longitude values change
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current && editLatitude !== "" && editLongitude !== "") {
      const lat = Number(editLatitude);
      const lng = Number(editLongitude);
      const currentPos = markerInstanceRef.current.getLatLng();

      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerInstanceRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 15);
      }
      mapInstanceRef.current.invalidateSize();
    }
  }, [editLatitude, editLongitude]);

  // Map search handler
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    try {
      setSearchLoading(true);
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(mapSearchQuery)}`
      );
      const data = await resp.json();
      setSearchResults(data);
      if (data.length === 0) toast.error("No locations found.");
    } catch (err) {
      console.error("Map search error:", err);
      toast.error("Location search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    setEditLatitude(lat);
    setEditLongitude(lng);
    setSearchResults([]);
    setMapSearchQuery(result.display_name);

    if (result.address) {
      const cityVal = result.address.city || result.address.town || result.address.village || result.address.county || "";
      const stateVal = result.address.state || "";
      const areaVal = result.address.suburb || result.address.neighbourhood || result.address.residential || "";

      if (cityVal) setEditCity(cityVal);
      if (stateVal) setEditState(stateVal);
      if (areaVal) setEditAreaLocation(areaVal);
    }
    toast.success("Marker moved to selected location.");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setSearchLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setEditLatitude(lat);
        setEditLongitude(lng);
        setSearchLoading(false);
        toast.success("Marker updated to current location.");

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const data = await resp.json();
          if (data?.address) {
            const cityVal = data.address.city || data.address.town || data.address.village || data.address.county || "";
            const stateVal = data.address.state || "";
            const areaVal = data.address.suburb || data.address.neighbourhood || data.address.residential || "";

            if (cityVal) setEditCity(cityVal);
            if (stateVal) setEditState(stateVal);
            if (areaVal) setEditAreaLocation(areaVal);
            if (data.display_name) setMapSearchQuery(data.display_name);
          }
        } catch (e) {
          console.error("Reverse geocode failed:", e);
        }
      },
      (err) => {
        setSearchLoading(false);
        console.error("Geolocation error:", err);
        toast.error("Unable to retrieve location.");
      }
    );
  };

  // Handle Approval Action
  const handleApprove = async () => {
    if (!selectedProperty) return;
    try {
      setActionLoading(true);
      await adminService.approveProperty(selectedProperty.id, approveReason);
      toast.success(`Property "${selectedProperty.title}" has been approved!`);

      const approvedProp = { ...selectedProperty, status: "live" as const };
      setPendingProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
      setLiveProperties((prev) => [approvedProp, ...prev]);

      setApproveModalOpen(false);
      setInspectModalOpen(false);
      setSelectedProperty(null);
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to approve property."));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Rejection / Unpublish Action
  const handleReject = async () => {
    if (!selectedProperty) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for taking action on this listing.");
      return;
    }
    try {
      setActionLoading(true);
      await adminService.rejectProperty(selectedProperty.id, rejectReason);
      toast.error(`Property listing "${selectedProperty.title}" has been rejected / unpublished.`);

      setPendingProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
      setLiveProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));

      setRejectModalOpen(false);
      setInspectModalOpen(false);
      setSelectedProperty(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to reject property."));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Open Admin Edit Modal ──
  const openEditModal = (prop: AdminProperty) => {
    setEditingProperty(prop);
    setEditTitle(prop.title || "");
    setEditDescription(prop.description || "");
    setEditCategory(prop.category || "apartment");
    setEditIntent(prop.intent || "rent");
    setEditPrice(prop.price || "");
    setEditPriceUnit(prop.price_unit || "per_month");
    setEditDeposit(prop.deposit || prop.security_deposit || "");
    setEditBedrooms(prop.bedrooms || "");
    setEditBathrooms(prop.bathrooms || "");
    setEditArea(prop.area || prop.built_up_sqft || "");
    setEditFurnishing(prop.furnishing || prop.furnishing_status || "semi");
    const existingVideoLinks = prop.video_link
      ? prop.video_link.split(/[\n,\s]+/).map((s: string) => s.trim()).filter(Boolean)
      : [];
    setEditVideoLinks(existingVideoLinks);
    setNewVideoLinkInput("");
    setEditAddress(prop.location_address || "");
    setEditAreaLocation(prop.location_area || "");
    setEditCity(prop.location_city || "");
    setEditPincode(prop.location_pincode || "682030");
    setEditState(prop.location_state || "Kerala");
    setEditLatitude(prop.latitude || "");
    setEditLongitude(prop.longitude || "");

    const fetchedAmenities = (prop.amenities || []).map((a) => (typeof a === "string" ? a : a.name));
    setEditAmenities(fetchedAmenities);
    setAvailableAmenities((prev) => {
      const merged = [...prev];
      fetchedAmenities.forEach((item: string) => {
        if (!merged.includes(item)) merged.push(item);
      });
      return merged;
    });

    const photosList = (prop.photos || []).map((p) => getPhotoUrl(p)).filter(Boolean);
    setEditPhotos(photosList);

    if (prop.extra_details?.room_sharing) {
      setEditRoomSharingOptions(prop.extra_details.room_sharing);
    } else {
      setEditRoomSharingOptions([]);
    }

    // Destroy existing map instance so it cleanly initializes
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    }

    setEditModalOpen(true);
  };

  // Toggle Amenity
  const handleToggleAmenity = (item: string) => {
    setEditAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  // Add Custom Amenity Tag
  const handleAddCustomAmenity = () => {
    const val = customAmenityInput.trim();
    if (!val) return;
    if (!availableAmenities.includes(val)) {
      setAvailableAmenities((prev) => [...prev, val]);
    }
    if (!editAmenities.includes(val)) {
      setEditAmenities((prev) => [...prev, val]);
    }
    setCustomAmenityInput("");
    toast.success(`Added amenity "${val}"`);
  };

  // File Upload Handler (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (editPhotos.length + files.length > 10) {
      toast.error("Maximum 10 photos allowed.");
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setEditPhotos((prev) => [...prev, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Photo by URL
  const handleAddPhotoUrl = () => {
    const url = newPhotoUrlInput.trim();
    if (!url) return;
    if (editPhotos.length >= 10) {
      toast.error("Maximum 10 photos allowed.");
      return;
    }
    setEditPhotos((prev) => [...prev, url]);
    setNewPhotoUrlInput("");
    toast.success("Photo URL added.");
  };

  const handleRemovePhoto = (index: number) => {
    setEditPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Add / Remove YouTube Video Links
  const handleAddVideoLink = () => {
    const trimmed = newVideoLinkInput.trim();
    if (!trimmed) return;
    const parsed = trimmed.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean);
    setEditVideoLinks((prev) => {
      const updated = [...prev];
      parsed.forEach((link) => {
        if (!updated.includes(link)) updated.push(link);
      });
      return updated;
    });
    setNewVideoLinkInput("");
    toast.success("YouTube Video Link added!");
  };

  const handleRemoveVideoLink = (index: number) => {
    setEditVideoLinks((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save Admin Edit Property ──
  const handleSaveEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    if (!editTitle.trim()) {
      toast.error("Property title is required.");
      return;
    }
    if (!editPrice || Number(editPrice) <= 0) {
      toast.error("Valid price is required.");
      return;
    }
    if (!editAreaLocation.trim() || !editCity.trim()) {
      toast.error("Area and City location fields are required.");
      return;
    }

    try {
      setEditSaving(true);
      const isPg = ["pg", "hostel", "pg_hostel"].includes(editCategory);
      
      const validSharingOptions = editRoomSharingOptions.filter(
        (opt) => opt.sharing !== "" && opt.price !== "" && opt.vacancy !== ""
      );
      const leastPrice = validSharingOptions.length > 0 
        ? Math.min(...validSharingOptions.map(opt => Number(opt.price))) 
        : 0;

      const payload = {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        category: editCategory,
        intent: editIntent,
        price: isPg ? leastPrice : Number(editPrice),
        price_unit: editPriceUnit,
        deposit: editDeposit ? Number(editDeposit) : undefined,
        bedrooms: editBedrooms ? Number(editBedrooms) : undefined,
        bathrooms: editBathrooms ? Number(editBathrooms) : undefined,
        area: editArea ? Number(editArea) : undefined,
        furnishing: editFurnishing,
        video_link: editVideoLinks.filter(Boolean).join("\n") || undefined,
        amenities: editAmenities,
        photos: editPhotos,
        extra_details: {
          ...(editingProperty.extra_details || {}),
          ...(isPg ? { room_sharing: validSharingOptions } : {})
        },
        location: {
          address: editAddress.trim() || undefined,
          area: editAreaLocation.trim(),
          city: editCity.trim(),
          pincode: editPincode.trim() || "682030",
          state: editState.trim(),
          latitude: editLatitude !== "" ? Number(editLatitude) : undefined,
          longitude: editLongitude !== "" ? Number(editLongitude) : undefined,
        },
      };

      const updated = await adminService.updateProperty(editingProperty.id, payload);
      toast.success("Property details updated successfully!");

      const updater = (list: AdminProperty[]) =>
        list.map((p) => (p.id === editingProperty.id ? { ...p, ...updated } : p));

      setPendingProperties(updater);
      setLiveProperties(updater);

      if (selectedProperty && selectedProperty.id === editingProperty.id) {
        setSelectedProperty((prev) => (prev ? { ...prev, ...updated } : null));
      }

      setEditModalOpen(false);
      setEditingProperty(null);
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to update property details."));
    } finally {
      setEditSaving(false);
    }
  };

  const currentList = activeTab === "pending" ? pendingProperties : liveProperties;

  // Filter properties based on search and category
  const filteredProperties = currentList.filter((prop) => {
    const matchesSearch =
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.ref_code && prop.ref_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prop.ref && prop.ref.toLowerCase().includes(searchQuery.toLowerCase())) ||
      prop.location_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.location_area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || prop.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesIntent =
      intentFilter === "all" || prop.intent.toLowerCase() === intentFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesIntent;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight my-0">
            Properties Queue & Moderation
          </h1>
          <p className="text-xs text-slate-500 font-semibold -mt-4!">
            Review, inspect, edit, and approve property submissions submitted by owners & agencies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/admin-platform/properties/add")}
            className="inline-flex items-center justify-center gap-2 bg-[#014645] hover:bg-[#013534] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Property</span>
          </button>

          <button
            onClick={() => fetchProperties(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200/80 px-4 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 px-4 font-extrabold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "pending"
                ? "border-[#014645] text-[#014645]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Pending Queue</span>
            <span
              className={`h-5 min-w-5 ${
                pendingProperties.length < 10 ? "w-5" : "px-1.5"
              } rounded-full text-[10px] font-black flex items-center justify-center leading-none ${
                activeTab === "pending"
                  ? "bg-[#014645] text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {pendingProperties.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`pb-3 px-4 font-extrabold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "live"
                ? "border-[#014645] text-[#014645]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Live Moderated Listings</span>
            <span
              className={`h-5 min-w-5 ${
                liveProperties.length < 10 ? "w-5" : "px-1.5"
              } rounded-full text-[10px] font-black flex items-center justify-center leading-none ${
                activeTab === "live"
                  ? "bg-[#014645] text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {liveProperties.length}
            </span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, reference code, city, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#014645]/20 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {propertyTypes.map((t: any) => (
                <option key={t.slug} value={t.slug}>{t.label}</option>
              ))}
            </select>

            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Intents</option>
              <option value="rent">Rent</option>
              <option value="buy">Sale / Buy</option>
              <option value="lease">Lease</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Queue List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-[#014645] animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Loading property queue...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center p-6">
          <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 my-0">No Properties Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {activeTab === "pending"
              ? "All submitted listings have been reviewed or match no filters."
              : "No live properties match the selected search filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-3 p-4">
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5">
                      {prop.category}
                    </Badge>
                    <Badge variant="secondary" className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5">
                      For {prop.intent}
                    </Badge>
                    {prop.video_link && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-extrabold text-[9px] px-1.5 py-0 flex items-center gap-1">
                        <YoutubeIcon className="h-3 w-3 text-rose-600" /> Video
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">
                    {prop.ref || prop.ref_code || "REF-CODE"}
                  </span>
                </div>

                {/* Property Title & Location */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1 my-0 title-hover" title={prop.title}>
                    {prop.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {prop.location_area}, {prop.location_city}
                    </span>
                  </p>
                </div>

                {/* Main Image Thumbnail */}
                <div
                  onClick={() => openEditModal(prop)}
                  className="relative rounded-lg overflow-hidden h-36 border border-slate-100 cursor-pointer group"
                >
                  <img
                    src={
                      prop.photos && prop.photos.length > 0
                        ? getPhotoUrl(prop.photos[0])
                        : getCategoryFallbackImage(prop.category)
                    }
                    alt={prop.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {prop.photos?.length || 0} Photos
                  </div>
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5">
                    <Pencil className="h-4 w-4" /> Quick Edit
                  </div>
                </div>

                {/* Price & Specs */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">
                      Price
                    </span>
                    <span className="text-sm font-black text-[#014645]">
                      {formatPrice(prop.price)}
                    </span>
                  </div>

                  {prop.owner && (
                    <div className="text-right">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">
                        Submitted By
                      </span>
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {prop.owner.name} ({prop.owner_role})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="bg-slate-50/70 border-t border-slate-200/80 px-2 sm:px-4 py-3 flex items-center justify-between sm:justify-end gap-1.5">
                {activeTab === "live" && (
                  <button
                    onClick={async () => {
                      try {
                        const updated = await adminService.toggleFeatureProperty(prop.id);
                        toast.success(
                          updated.is_featured
                            ? `"${prop.title}" is now featured on landing page!`
                            : `"${prop.title}" unfeatured.`
                        );
                        const updater = (list: AdminProperty[]) =>
                          list.map((p) => (p.id === prop.id ? { ...p, is_featured: updated.is_featured } : p));
                        setPendingProperties(updater);
                        setLiveProperties(updater);
                      } catch (err: any) {
                        toast.error("Failed to update featured status.");
                      }
                    }}
                    className={`font-extrabold text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border flex-1 sm:flex-none ${
                      prop.is_featured
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                    title={prop.is_featured ? "Featured on Landing Page (Click to unfeature)" : "Feature on Landing Page"}
                  >
                    <Sparkles className={`h-3.5 w-3.5 shrink-0 ${prop.is_featured ? "fill-emerald-600 text-emerald-600" : "text-slate-400"}`} />
                    <span className="truncate">{prop.is_featured ? "Featured" : "Feature"}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedProperty(prop);
                    fetchPropertyReviews(prop.id);
                    setInspectModalOpen(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-none"
                  title="Inspect Listing"
                >
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Inspect</span>
                </button>

                <button
                  onClick={() => openEditModal(prop)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-bold text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-none"
                  title="Edit All Property Details"
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                  <span className="truncate">Edit</span>
                </button>

                {activeTab === "pending" ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedProperty(prop);
                        setApproveReason("Meets all listing standards & verified");
                        setApproveModalOpen(true);
                      }}
                      className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-none"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Approve</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProperty(prop);
                        setRejectReason("");
                        setRejectModalOpen(true);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-2 sm:px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      title="Reject Listing"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedProperty(prop);
                      setRejectReason("Taken down from live status by admin.");
                      setRejectModalOpen(true);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-2 sm:px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    title="Delete / Unpublish Listing"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Comprehensive Inspect Details */}
      {inspectModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200 text-left">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider">
                    {selectedProperty.category}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-wider">
                    For {selectedProperty.intent}
                  </Badge>
                  <span className="text-[10px] font-black text-[#014645] bg-[#014645]/10 px-2 py-0.5 rounded-md border border-[#014645]/20">
                    {selectedProperty.ref || selectedProperty.ref_code || "REF-CODE"}
                  </span>
                  <Badge className={`text-[10px] font-black uppercase ${selectedProperty.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {selectedProperty.status}
                  </Badge>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mt-1.5 my-0">
                  {selectedProperty.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {selectedProperty.location_address
                    ? `${selectedProperty.location_address}, ${selectedProperty.location_area}, ${selectedProperty.location_city}`
                    : `${selectedProperty.location_area}, ${selectedProperty.location_city}, ${selectedProperty.location_state || 'Kerala'} - ${selectedProperty.location_pincode || ''}`}
                </p>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Submitter & Contact Info Banner */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-[#014645]" /> Submitted By ({selectedProperty.owner_role || 'owner'})
                </span>
                {selectedProperty.created_at && (
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedProperty.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Name</span>
                  <span className="text-xs font-black text-slate-900">
                    {selectedProperty.owner?.name || "Property Submitter"}
                  </span>
                </div>
                
                <div>
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Phone</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      {selectedProperty.owner_phone || selectedProperty.owner?.phone || "N/A"}
                    </span>
                    {(selectedProperty.owner_phone || selectedProperty.owner?.phone) && (
                      <a
                        href={`tel:${selectedProperty.owner_phone || selectedProperty.owner?.phone}`}
                        className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-1 rounded-md transition-colors"
                        title="Call Submitter"
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block">WhatsApp</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      {selectedProperty.owner_whatsapp || selectedProperty.owner_phone || "N/A"}
                    </span>
                    {(selectedProperty.owner_whatsapp || selectedProperty.owner_phone) && (
                      <a
                        href={`https://wa.me/${((selectedProperty.owner_whatsapp || selectedProperty.owner_phone) || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition-colors"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Specifications & Financial Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Price</span>
                <span className="text-sm font-black text-[#014645]">
                  {formatPrice(selectedProperty.price)}
                  {selectedProperty.price_unit && (
                    <span className="text-[10px] font-bold text-slate-500 ml-1">
                      / {selectedProperty.price_unit === 'per_month' ? 'month' : 'total'}
                    </span>
                  )}
                </span>
              </div>

              {/* Security Deposit: ONLY rendered if deposit exists and is > 0 */}
              {((selectedProperty.deposit && selectedProperty.deposit > 0) || (selectedProperty.security_deposit && selectedProperty.security_deposit > 0)) ? (
                <div>
                  <span className="text-[9.5px] font-black uppercase text-slate-400 block">Deposit</span>
                  <span className="text-xs font-bold text-slate-800">
                    {formatPrice((selectedProperty.deposit || selectedProperty.security_deposit)!)}
                  </span>
                </div>
              ) : null}

              <div>
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Built-up Area</span>
                <span className="text-xs font-bold text-slate-800">
                  {(selectedProperty.area || selectedProperty.built_up_sqft)
                    ? `${selectedProperty.area || selectedProperty.built_up_sqft} sq ft`
                    : "Not specified"}
                </span>
              </div>

              <div>
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Bedrooms / Bathrooms</span>
                <span className="text-xs font-bold text-slate-800 capitalize">
                  {selectedProperty.bedrooms || selectedProperty.bathrooms
                    ? `${selectedProperty.bedrooms || 0} BHK / ${selectedProperty.bathrooms || 0} Bath`
                    : "Not specified"}
                </span>
              </div>

              <div>
                <span className="text-[9.5px] font-black uppercase text-slate-400 block">Furnishing</span>
                <span className="text-xs font-bold text-slate-800 capitalize">
                  {selectedProperty.furnishing || selectedProperty.furnishing_status || "Unspecified"}
                </span>
              </div>
            </div>

            {/* Room Sharing Prices & Vacancy (PG/Hostel Only) */}
            {["pg", "hostel", "pg_hostel"].includes(selectedProperty.category) && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider my-0">
                  Room Sharing & Vacancy ({selectedProperty.extra_details?.room_sharing?.length || 0})
                </h4>
                {selectedProperty.extra_details?.room_sharing && selectedProperty.extra_details.room_sharing.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProperty.extra_details.room_sharing.map((opt: { sharing: number; price: number; vacancy: number }, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-black text-slate-900 block">
                            {opt.sharing} Sharing
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            ₹{opt.price?.toLocaleString()} / bed / month
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                            opt.vacancy > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : "bg-rose-50 text-rose-600 border-rose-200/60"
                          }`}
                        >
                          {opt.vacancy > 0 ? `${opt.vacancy} Vacant` : "Full"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic my-0">No sharing options added by owner.</p>
                )}
              </div>
            )}

            {/* Complete Location Details */}
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Location & Geolocation</span>
                {selectedProperty.latitude && selectedProperty.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedProperty.latitude},${selectedProperty.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#014645] hover:underline text-[10px] font-bold flex items-center gap-1"
                  >
                    Open in Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block">Address Line:</span>
                  <span>{selectedProperty.location_address || "No detailed street address provided."}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block">Area & City:</span>
                  <span>{selectedProperty.location_area}, {selectedProperty.location_city}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block">State & Pincode:</span>
                  <span>{selectedProperty.location_state || "Kerala"}  {selectedProperty.location_pincode || "682030"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block">Map Coordinates:</span>
                  <span>
                    {selectedProperty.latitude && selectedProperty.longitude
                      ? `${Number(selectedProperty.latitude).toFixed(6)}, ${Number(selectedProperty.longitude).toFixed(6)}`
                      : "No coordinates pinned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Amenities Badges */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider my-0">
                Amenities & Facilities ({selectedProperty.amenities?.length || 0})
              </h4>
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProperty.amenities.map((item, idx) => {
                    const amenityName = typeof item === "string" ? item : (item as any)?.name || item;
                    return (
                      <span
                        key={idx}
                        className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Check className="h-3 w-3 text-emerald-600" />
                        {amenityName}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic my-0">No amenities selected by owner.</p>
              )}
            </div>

            {/* Video Link Highlight if Present */}
            {selectedProperty.video_link && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">
                  YouTube Video Links ({selectedProperty.video_link.split(/[\n,\s]+/).map((s: string) => s.trim()).filter(Boolean).length})
                </span>
                <div className="space-y-2">
                  {selectedProperty.video_link.split(/[\n,\s]+/).map((s: string) => s.trim()).filter(Boolean).map((vUrl: string, idx: number) => (
                    <div key={idx} className="bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                          {idx + 1}
                        </div>
                        <YoutubeIcon className="h-4 w-4 text-rose-600 shrink-0" />
                        <span className="text-xs font-bold text-rose-900 truncate">
                          {vUrl}
                        </span>
                      </div>
                      <a
                        href={vUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                      >
                        Watch <ExternalLink className="h-3 w-3 inline shrink-0" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider my-0">
                Property Photos ({selectedProperty.photos?.length || 0})
              </h4>
              {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedProperty.photos.map((photo, i) => {
                    const url = getPhotoUrl(photo) || getCategoryFallbackImage(selectedProperty.category);
                    return (
                      <div
                        key={i}
                        onClick={() => setPreviewImage(url)}
                        className="relative rounded-lg overflow-hidden border border-slate-200 cursor-pointer group/img h-24"
                        title="Click to expand"
                      >
                        <img
                          src={url}
                          alt={`Property photo ${i + 1}`}
                          className="h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => setPreviewImage(getCategoryFallbackImage(selectedProperty.category))}
                  className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer group/img relative"
                >
                  <img
                    src={getCategoryFallbackImage(selectedProperty.category)}
                    alt="Property Preview"
                    className="h-40 w-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
            </div>

            {/* Property Description */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider my-0">
                Property Description
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-200/60 font-medium">
                {selectedProperty.description || "No description provided by owner."}
              </p>
            </div>

            {/* User Reviews & Ratings Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#014645]" />
                  <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider my-0">
                    User Reviews &amp; Ratings ({propertyReviews.length})
                  </h4>
                </div>
                {propertyReviews.length > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-extrabold">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>
                      {(
                        propertyReviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
                        propertyReviews.length
                      ).toFixed(1)}{" "}
                      / 5.0
                    </span>
                  </div>
                )}
              </div>

              {loadingReviews ? (
                <div className="flex items-center justify-center py-6 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                  <Loader2 className="h-4 w-4 text-[#014645] animate-spin" />
                  <span className="text-xs font-semibold text-slate-500 ml-2">Loading user reviews...</span>
                </div>
              ) : propertyReviews.length === 0 ? (
                <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/60 text-center">
                  <p className="text-xs text-slate-400 font-medium italic my-0">
                    No user reviews submitted for this property yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {propertyReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-slate-50 hover:bg-slate-100/80 rounded-xl p-3.5 border border-slate-200/80 flex flex-col justify-between gap-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#014645]/10 text-[#014645] font-black text-xs flex items-center justify-center border border-[#014645]/20 shrink-0">
                            {review.reviewer_name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900">
                                {review.reviewer_name || "Anonymous User"}
                              </span>
                              {review.user?.role && (
                                <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0">
                                  {review.user.role}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={`h-3 w-3 ${
                                    idx < (review.rating || 5)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200 fill-slate-200"
                                  }`}
                                />
                              ))}
                              <span className="text-[10px] text-slate-400 font-medium ml-1.5">
                                {new Date(review.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Delete Review Button */}
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1 text-[11px] font-extrabold"
                          title="Delete unwanted review"
                        >
                          {deletingReviewId === review.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs font-medium text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 my-0 leading-relaxed">
                        &quot;{review.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inspect Modal Footer */}
            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInspectModalOpen(false);
                    openEditModal(selectedProperty);
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Details
                </button>

                {activeTab === "pending" || selectedProperty.status === "pending_review" ? (
                  <>
                    <button
                      onClick={() => {
                        setInspectModalOpen(false);
                        setRejectReason("");
                        setRejectModalOpen(true);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer"
                    >
                      Reject Listing
                    </button>
                    <button
                      onClick={() => {
                        setInspectModalOpen(false);
                        setApproveReason("Meets all listing standards & verified");
                        setApproveModalOpen(true);
                      }}
                      className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs cursor-pointer"
                    >
                      Approve Listing
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setInspectModalOpen(false);
                      setRejectReason("Taken down from live status by admin.");
                      setRejectModalOpen(true);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Unpublish Listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADMIN COMPREHENSIVE EDIT PROPERTY MODAL (EXACT OWNER FORM PARITY) ── */}
      {editModalOpen && editingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 my-0">
                    Edit Property Listing (Admin Portal)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium my-0">
                    Modify listing details, deposit, YouTube links, photos, or pin location on the map.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProperty} className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 my-0">
                  <Building2 className="h-4 w-4 text-[#014645]" /> Basic Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Property Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                    >
                      {propertyTypes.length > 0 ? (
                        propertyTypes.map((t: any) => (
                          <option key={t.slug} value={t.slug}>{t.label}</option>
                        ))
                      ) : (
                        <option value="apartment">Apartment</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Listing Intent</label>
                    <select
                      value={editIntent}
                      onChange={(e) => setEditIntent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                    >
                      <option value="rent">For Rent</option>
                      <option value="buy">For Sale / Buy</option>
                      <option value="lease">For Lease</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Listing Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. 15 Cents Plot in Muvattupuzha"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Detailed Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe key features, house rules, nearby landmarks, or highlights..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Terms (With Security Deposit) */}
              { !["pg", "hostel", "pg_hostel"].includes(editCategory) && (
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 my-0">
                  ₹ Pricing & Deposit Terms
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Price (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 4500000"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Price Unit</label>
                    <select
                      value={editPriceUnit}
                      onChange={(e) => setEditPriceUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    >
                      <option value="per_month">Per Month</option>
                      <option value="total">Total Price</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Security Deposit (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000 (Optional)"
                      value={editDeposit}
                      onChange={(e) => setEditDeposit(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Section 2.5: Room Sharing Options (PG/Hostel Only) */}
              { ["pg", "hostel", "pg_hostel"].includes(editCategory) && (
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 my-0">
                      <Building2 className="h-4 w-4 text-[#014645]" /> Room Sharing Options
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 mb-0">
                      One row per room type (Single, Double, Triple, etc.) with its own bed price and available beds.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addEditRoomSharingOption}
                    className="bg-[#014645]/10 text-[#014645] font-bold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-[#014645]/20 transition-colors border-0 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Add Room Type
                  </button>
                </div>

                {editRoomSharingOptions.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium">No sharing options added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {editRoomSharingOptions.map((option, index) => (
                      <div key={index} className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 px-4 py-4 pr-12 rounded-lg border border-slate-100 items-start">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Beds per Room *</label>
                          <input
                            type="number"
                            placeholder="e.g. 2 for Double Sharing"
                            value={option.sharing}
                            onChange={(e) => updateEditRoomSharingOption(index, "sharing", e.target.value ? Number(e.target.value) : "")}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                          />
                          <p className="text-[10px] text-slate-400 font-medium my-0">1 = Single, 2 = Double, 3 = Triple...</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Rent per Bed (₹/month) *</label>
                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={option.price}
                            onChange={(e) => updateEditRoomSharingOption(index, "price", e.target.value ? Number(e.target.value) : "")}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                          />
                          <p className="text-[10px] text-slate-400 font-medium my-0">Monthly rent per bed for this sharing type</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Beds Available *</label>
                          <input
                            type="number"
                            placeholder="e.g. 5"
                            value={option.vacancy}
                            onChange={(e) => updateEditRoomSharingOption(index, "vacancy", e.target.value ? Number(e.target.value) : "")}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                          />
                          <p className="text-[10px] text-slate-400 font-medium my-0">Current vacant beds (0 = fully booked)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditRoomSharingOption(index)}
                          className="absolute right-3 top-5 mt-[22px] bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-md transition-colors flex items-center justify-center border-0 cursor-pointer h-[34px] w-[34px]"
                          title="Remove this Room Sharing Option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Section 4: Property Specifications (Accordion) */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-2xs text-left">
                <button
                  type="button"
                  onClick={() => setSpecsOpen(!specsOpen)}
                  className="w-full flex items-center justify-between text-xs font-black uppercase text-slate-800 border-0 bg-transparent p-0 cursor-pointer"
                >
                  <span>Property Specifications</span>
                  {specsOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>

                {specsOpen && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Area (sq ft)</label>
                      <input
                        type="number"
                        placeholder="e.g. 6500"
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Bedrooms</label>
                      <input
                        type="number"
                        placeholder="e.g. 4"
                        value={editBedrooms}
                        onChange={(e) => setEditBedrooms(e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Bathrooms</label>
                      <input
                        type="number"
                        placeholder="e.g. 4"
                        value={editBathrooms}
                        onChange={(e) => setEditBathrooms(e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Furnishing</label>
                      <select
                        value={editFurnishing}
                        onChange={(e) => setEditFurnishing(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                      >
                        <option value="semi">Semi-Furnished</option>
                        <option value="furnished">Fully Furnished</option>
                        <option value="unfurnished">Unfurnished</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Location Details & Leaflet Interactive Map */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 my-0">
                  <MapPin className="h-4 w-4 text-[#014645]" /> Location Details & Map Pin
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700">Address / Street / Landmark</label>
                    <input
                      type="text"
                      placeholder="e.g. Kacheripady Road, Muvattupuzha"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Area / Locality *</label>
                    <input
                      type="text"
                      placeholder="e.g. Muvattupuzha"
                      value={editAreaLocation}
                      onChange={(e) => setEditAreaLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ernakulam / Kochi"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Pincode</label>
                    <input
                      type="text"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {/* Leaflet Map Pin & Nominatim Search */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-black text-slate-900 block">Pin Exact Map Coordinates</label>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider my-0">
                        Drag the marker or search address to reposition
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={searchLoading}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all border-0 cursor-pointer disabled:opacity-50"
                    >
                      {searchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5 text-[#014645]" />}
                      Current Location
                    </button>
                  </div>

                  {/* Address Search Bar */}
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search for locality or landmark on map..."
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleMapSearch}
                      disabled={searchLoading}
                      className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-1.5 rounded-lg transition-all cursor-pointer border-0"
                    >
                      Search
                    </button>

                    {/* Suggestions Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((res, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSearchResult(res)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer block"
                          >
                            {res.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leaflet Canvas */}
                  <div
                    ref={mapRef}
                    className="h-60 w-full rounded-xl border border-slate-200 overflow-hidden relative z-10 bg-[#aad3df] [&_.leaflet-container]:!bg-[#aad3df]"
                    style={{ minHeight: "240px" }}
                  />
                </div>
              </div>

              {/* Section 6: Amenities & Facilities */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider my-0">
                  Amenities & Facilities
                </h4>

                <div className="flex flex-wrap gap-2">
                  {availableAmenities.map((item) => {
                    const selected = editAmenities.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => handleToggleAmenity(item)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          selected
                            ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {item}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amenity Adder */}
                <div className="flex items-center gap-2 pt-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Add custom amenity tag..."
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="bg-[#014645] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer border-0 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Section 7: Listing Photos & Media */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-2xs space-y-5">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 my-0">
                  <ImageIcon className="h-4 w-4 text-[#014645]" /> Listing Photos & Media
                </h4>

                {/* Photos Uploader */}
                <div className="space-y-3">
                  <span className="text-[11px] font-extrabold text-slate-700 block">Property Photos</span>
                  <input
                    type="file"
                    id="admin-property-file-input"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="admin-property-file-input"
                      className="inline-flex bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2 rounded-lg items-center gap-1.5 cursor-pointer shadow-2xs transition-all h-9"
                    >
                      <Plus className="h-4 w-4" /> Upload Photos from Storage
                    </label>

                    <div className="flex items-center gap-2 flex-1 min-w-60">
                      <input
                        type="url"
                        placeholder="Or paste direct Image URL..."
                        value={newPhotoUrlInput}
                        onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhotoUrl}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer border-0 h-8"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Photo Thumbnails */}
                  {editPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                      {editPhotos.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 h-24">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-90 hover:opacity-100 transition-opacity border-0 cursor-pointer"
                            title="Remove Photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* YouTube Video Links Section inside Media */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-rose-900 tracking-wider flex items-center gap-1.5 my-0">
                      <YoutubeIcon className="h-4 w-4 text-rose-600" /> YouTube Video Links ({editVideoLinks.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Add multiple video URLs</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      value={newVideoLinkInput}
                      onChange={(e) => setNewVideoLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddVideoLink();
                        }
                      }}
                      className="flex-1 bg-rose-50/40 border border-rose-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddVideoLink}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs border-0 h-9 shrink-0"
                    >
                      <Plus className="h-4 w-4" /> Add Video Link
                    </button>
                  </div>

                  {/* Added Video Links List */}
                  {editVideoLinks.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {editVideoLinks.map((vUrl, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs font-semibold text-slate-800"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-5 w-5 rounded-md bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <YoutubeIcon className="h-4 w-4 text-rose-600 shrink-0" />
                            <a
                              href={vUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-rose-900 hover:underline truncate font-extrabold text-xs"
                            >
                              {vUrl}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideoLink(idx)}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-100 p-1 rounded-md transition-colors border-0 cursor-pointer shrink-0"
                            title="Remove Video Link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {editSaving ? "Saving Updates..." : "Save & Update Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Approve Confirmation */}
      {approveModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 my-0">
                  Approve Listing Submission
                </h3>
                <p className="text-xs text-slate-500 font-medium my-0">
                  This will publish "{selectedProperty.title}" to live search results.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Approval Note (Optional)</label>
              <textarea
                rows={2}
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-5 py-2 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {actionLoading ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reject / Unpublish Confirmation */}
      {rejectModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 my-0">
                  {activeTab === "pending" ? "Reject Property Listing" : "Unpublish Live Listing"}
                </h3>
                <p className="text-xs text-slate-500 font-medium my-0">
                  {activeTab === "pending" 
                    ? "Provide a reason for the listing owner."
                    : "Are you sure you want to unpublish this listing? It will immediately be removed from public view."}
                </p>
              </div>
            </div>

            {activeTab === "pending" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reason *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Incomplete details, invalid location, missing clear photos..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-900"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleReject}
                disabled={actionLoading || (activeTab === "pending" && !rejectReason.trim())}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 border-0"
              >
                <X className="h-3.5 w-3.5" />
                {actionLoading ? "Processing..." : activeTab === "pending" ? "Reject Listing" : "Confirm Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
