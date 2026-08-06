import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Trash2,
  Send,
  MapPin,
  Image as ImageIcon,
  Info,
  ArrowLeft,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Navigation,
  Loader2,
  UserCog,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { adminService, type AdminUser } from "@/services/adminService";
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

type ListingParty = "owner" | "admin" | "agency";

export const AdminAddPropertyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  // ── Listing party ──
  const [listingParty, setListingParty] = useState<ListingParty>("owner");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // ── Form State ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [intent, setIntent] = useState<"rent" | "buy" | "lease">("rent");
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);

  const [price, setPrice] = useState<number | "">("");
  const [priceUnit, setPriceUnit] = useState<"per_month" | "total">("per_month");
  const [deposit, setDeposit] = useState<number | "">("");

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
  const [videoLink, setVideoLink] = useState("");

  const [availabilityStatus, setAvailabilityStatus] = useState<"available" | "occupied" | "upcoming">("available");
  const [availableFrom, setAvailableFrom] = useState("");
  const [roomSharingOptions, setRoomSharingOptions] = useState<Array<{ sharing: number | ""; price: number | ""; vacancy: number | "" }>>([]);

  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [listingStatus, setListingStatus] = useState<"draft" | "pending_review" | "live">("pending_review");

  const addRoomSharingOption = () => {
    setRoomSharingOptions([...roomSharingOptions, { sharing: "", price: "", vacancy: "" }]);
  };
  const removeRoomSharingOption = (index: number) => {
    const next = [...roomSharingOptions];
    next.splice(index, 1);
    setRoomSharingOptions(next);
  };
  const updateRoomSharingOption = (index: number, field: "sharing" | "price" | "vacancy", value: number | "") => {
    const next = [...roomSharingOptions];
    next[index][field] = value;
    setRoomSharingOptions(next);
  };


  const [specsOpen, setSpecsOpen] = useState(false);

  // ── Map ──
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

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

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      setLatitude(position.lat);
      setLongitude(position.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current && latitude !== "" && longitude !== "") {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const currentPos = markerInstanceRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerInstanceRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 15);
      }
      mapInstanceRef.current.invalidateSize();
    }
  }, [latitude, longitude]);

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
      if (data.length === 0) toast.error("No locations found for your search.");
    } catch (err) {
      console.error("Nominatim search failed:", err);
      toast.error("Location search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    setLatitude(lat);
    setLongitude(lng);
    setSearchResults([]);
    setMapSearchQuery(result.display_name);

    if (result.address) {
      const cityVal = result.address.city || result.address.town || result.address.village || result.address.county || "";
      const stateVal = result.address.state || "";
      let areaVal = result.address.suburb || result.address.neighbourhood || result.address.residential || result.address.quarter || result.address.hamlet || result.address.city_district || "";
      if (!areaVal && result.name && result.name !== cityVal && result.name !== stateVal) areaVal = result.name;
      if (!areaVal && result.display_name) areaVal = result.display_name.split(",")[0].trim();

      if (cityVal) setCity(cityVal);
      if (stateVal) setState(stateVal);
      if (areaVal) setLocationArea(areaVal);
    }
    toast.success("Location updated on map.");
  };

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
            if (!areaVal && data.name && data.name !== cityVal && data.name !== stateVal) areaVal = data.name;
            if (!areaVal && data.display_name) areaVal = data.display_name.split(",")[0].trim();
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

  // ── Load property types ──
  useEffect(() => {
    api
      .get("/api/properties/config/types")
      .then((res) => setPropertyTypes(res.data))
      .catch((err) => console.error("Failed to load property types", err));
  }, []);

  // ── Load owner/agency users for the picker ──
  useEffect(() => {
    setUsersLoading(true);
    adminService
      .getUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setUsersLoading(false));
  }, []);

  // Reset selected user + category when listing party changes
  useEffect(() => {
    setSelectedUserId("");
    setUserSearch("");
    const allowedTypes = propertyTypes.filter((t: any) => t.allowed_roles.includes(listingParty));
    setCategory(allowedTypes.length > 0 ? allowedTypes[0].slug : propertyTypes[0]?.slug || "");

    if (listingParty === "admin") {
      setOwnerPhone(user?.phone || "");
      setOwnerWhatsapp(user?.phone || "");
    } else {
      setOwnerPhone("");
      setOwnerWhatsapp("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingParty, propertyTypes.length]);

  // Auto-fill contact info from the selected owner/agency user
  useEffect(() => {
    if (listingParty === "admin" || !selectedUserId) return;
    const selected = users.find((u) => u.id === selectedUserId);
    if (selected) {
      setOwnerPhone(selected.phone || "");
      setOwnerWhatsapp(selected.phone || "");
    }
  }, [selectedUserId, listingParty, users]);

  const filteredUsers = users.filter((u) => {
    if (u.role !== listingParty) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.trim().toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.agency_profile?.display_name?.toLowerCase().includes(q)
    );
  });

  const allowedCategoryTypes = propertyTypes.filter((t: any) =>
    listingParty === "admin" ? true : t.allowed_roles.includes(listingParty)
  );

  const handleToggleAmenity = (item: string) => {
    setAmenities((prev) => (prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]));
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
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 2MB.`);
      } else {
        validFiles.push(file);
        validPreviews.push(URL.createObjectURL(file));
      }
    });
    if (validFiles.length > 0) {
      setNewFiles((prev) => [...prev, ...validFiles]);
      setNewFilePreviews((prev) => [...prev, ...validPreviews]);
    }
    e.target.value = "";
  };

  const handleRemoveExistingPhoto = async (index: number) => {
    const urlToRemove = photos[index];
    setPhotos(photos.filter((_, i) => i !== index));
    if (urlToRemove) {
      try {
        await api.post("/api/media/delete", { url: urlToRemove });
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

  const handleSubmitForm = useCallback(
    async (targetStatus: "draft" | "pending_review" | "live") => {
      if (listingParty !== "admin" && !selectedUserId) {
        toast.error(`Please select which ${listingParty} this listing belongs to.`);
        return;
      }
      if (!title.trim()) {
        toast.error("Property title is required.");
        return;
      }
      if (!category) {
        toast.error("Please select a property category.");
        return;
      }
      if (!["pg", "hostel", "pg_hostel"].includes(category) && (!price || Number(price) <= 0)) {
        toast.error("Valid price is required.");
        return;
      }
      if (!locationArea.trim() || !city.trim()) {
        toast.error("Area and City location fields are required.");
        return;
      }
      if (!ownerPhone.trim()) {
        toast.error("Contact phone number is required.");
        return;
      }
      if (photos.length + newFiles.length === 0) {
        toast.error("At least one photo upload is required.");
        return;
      }

      try {
        setSubmitting(true);

        let uploadedUrls: string[] = [];
        if (newFiles.length > 0) {
          const uploadPromises = newFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "uploads");
            try {
              const res = await api.post("/api/media/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
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

        const validSharingOptions = roomSharingOptions.filter(
          (opt) => opt.sharing !== "" && opt.price !== "" && opt.vacancy !== ""
        );
        const leastPrice = validSharingOptions.length > 0 
          ? Math.min(...validSharingOptions.map(opt => Number(opt.price))) 
          : 0;

        const payload: Record<string, unknown> = {
          listing_party: listingParty,
          owner_id: listingParty === "admin" ? undefined : selectedUserId,
          category,
          intent,
          title: title.trim(),
          description: description.trim() || undefined,
          price: ["pg", "hostel", "pg_hostel"].includes(category) ? leastPrice : Number(price),
          price_unit: priceUnit,
          deposit: deposit !== "" ? Number(deposit) : undefined,
          area: area ? Number(area) : undefined,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          furnishing,
          amenities,
          photos: finalPhotos,
          video_link: videoLink.trim() || undefined,
          extra_details: {
            availability_status: availabilityStatus,
            available_from: availableFrom || undefined,
            ...( ["pg", "hostel", "pg_hostel"].includes(category)
              ? { room_sharing: validSharingOptions }
              : {}),
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
          owner_phone: ownerPhone.trim(),
          owner_whatsapp: ownerWhatsapp.trim() || undefined,
          status: targetStatus,
        };

        await adminService.createProperty(payload);
        toast.success(
          targetStatus === "live"
            ? "Property created and published live!"
            : targetStatus === "draft"
              ? "Property saved as draft."
              : "Property created and sent to the review queue."
        );
        navigate("/admin-platform/properties");
      } catch (err: unknown) {
        console.error("Property creation failed", err);
        const apiErr = err as { response?: { data?: { detail?: string } } };
        toast.error(apiErr.response?.data?.detail || "Failed to create property listing.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      listingParty,
      selectedUserId,
      title,
      category,
      price,
      locationArea,
      city,
      ownerPhone,
      photos,
      newFiles,
      intent,
      description,
      priceUnit,
      deposit,
      area,
      bedrooms,
      bathrooms,
      furnishing,
      amenities,
      videoLink,
      availabilityStatus,
      availableFrom,
      roomSharingOptions,
      address,
      pincode,
      state,
      latitude,
      longitude,
      ownerWhatsapp,
      navigate,
    ]
  );

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin-platform/properties")}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-md transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Properties Queue
        </button>
        <span className="text-xs font-extrabold text-slate-400">New Property Listing</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight my-0">Add a Property Listing</h1>
        <p className="text-xs text-slate-500 font-semibold">
          Create a listing on behalf of an owner, an agency, or under your own admin account.
        </p>
      </div>

      {/* Section 0: Listing Party */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
          <UserCog className="h-5 w-5 text-[#014645]" /> Listing Party
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["owner", "agency", "admin"] as ListingParty[]).map((party) => (
            <button
              key={party}
              type="button"
              onClick={() => setListingParty(party)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-extrabold border transition-all cursor-pointer capitalize ${listingParty === party
                  ? "bg-[#014645] border-[#014645] text-white shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
            >
              {party === "admin" ? "This Admin Account" : party}
            </button>
          ))}
        </div>

        {listingParty !== "admin" && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Select {listingParty === "owner" ? "Owner" : "Agency"} *
            </label>
            <input
              type="text"
              placeholder={`Search ${listingParty}s by name, email, or phone...`}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
            />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
              disabled={usersLoading}
            >
              <option value="">
                {usersLoading ? "Loading users..." : `Select a ${listingParty}...`}
              </option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.agency_profile?.display_name || u.name} — {u.email}
                </option>
              ))}
            </select>
            {!usersLoading && filteredUsers.length === 0 && (
              <p className="text-[10px] font-medium bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100">
                <Info className="h-3 w-3 inline mr-1" />
                No {listingParty} accounts match your search.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section 1: Basic Information */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
          <Building2 className="h-5 w-5 text-[#014645]" /> Basic Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-bold text-slate-700">Property Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
            >
              {allowedCategoryTypes.length > 0 ? (
                allowedCategoryTypes.map((t: any) => (
                  <option key={t.id} value={t.slug}>
                    {t.label}
                  </option>
                ))
              ) : (
                <option value="">Loading categories...</option>
              )}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-bold text-slate-700">Listing Intent</label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value as "rent" | "buy" | "lease")}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
            >
              <option value="rent">For Rent</option>
              <option value="buy">For Sale</option>
              <option value="lease">For Lease</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700">Listing Title *</label>
            <input
              type="text"
              placeholder="e.g. Luxury 2 BHK Apartment near InfoPark, Kakkanad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Describe key features, house rules, nearby landmarks, or highlights..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Pricing */}
      { !["pg", "hostel", "pg_hostel"].includes(category) && (

        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">₹ Pricing & Terms</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Price (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Price Unit</label>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value as "per_month" | "total")}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
              >
                <option value="per_month">Per Month</option>
                <option value="total">Total Price</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Security Deposit (₹) (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 30000"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 2.5: Room Sharing Options (PG/Hostel Only) */}
      { ["pg", "hostel", "pg_hostel"].includes(category) && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
              <Building2 className="h-5 w-5 text-[#014645]" /> Room Sharing Options
            </h2>
            <button
              type="button"
              onClick={addRoomSharingOption}
              className="bg-emerald-50 text-[#014645] font-bold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Option
            </button>
          </div>

          {roomSharingOptions.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
              <p className="text-xs text-slate-400 font-medium">No sharing options added yet.</p>
              <p className="text-[10px] text-slate-400 mt-1">Click "Add Option" to define room types (e.g. Single, Double, Triple) with per-bed price and vacancy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-4 gap-4 px-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sharing Type</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Price / Bed (₹)</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Vacancy (Beds)</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Remove</span>
              </div>
              {roomSharingOptions.map((option, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 sm:hidden">Sharing (e.g. 1, 2)</label>
                    <input
                      type="number"
                      placeholder="e.g. 2 for Double"
                      value={option.sharing}
                      onChange={(e) => updateRoomSharingOption(index, "sharing", e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 sm:hidden">Price per bed (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={option.price}
                        onChange={(e) => updateRoomSharingOption(index, "price", e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 sm:hidden">Vacancy (Beds)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={option.vacancy}
                      onChange={(e) => updateRoomSharingOption(index, "vacancy", e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => removeRoomSharingOption(index)}
                      className="w-full sm:w-auto bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-md transition-colors flex items-center justify-center border-0 cursor-pointer"
                      title="Remove Option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 3: Specs & Features - Accordion */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs">
        <button
          type="button"
          onClick={() => setSpecsOpen(!specsOpen)}
          className="w-full flex items-center justify-between text-base font-bold text-slate-900 border-0 bg-transparent p-0 cursor-pointer focus:outline-none"
        >
          <span className="flex items-center gap-2">Property Specifications</span>
          {specsOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
        </button>

        {specsOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
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

      {/* Section 4: Availability */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
          <Calendar className="h-5 w-5 text-[#014645]" /> Availability Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Current Occupancy/Availability</label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value as "available" | "occupied" | "upcoming")}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
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

      {/* Section 5: Location */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
          <MapPin className="h-5 w-5 text-[#014645]" /> Location Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-3">
            <label className="text-xs font-bold text-slate-700">Address / Building Name</label>
            <input
              type="text"
              placeholder="e.g. Flat 4B, Skyline Ivy League, Seaport Airport Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Area / Locality *</label>
            <input
              type="text"
              placeholder="e.g. Kakkanad"
              value={locationArea}
              onChange={(e) => setLocationArea(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">City *</label>
            <input
              type="text"
              placeholder="e.g. Kochi"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Pincode</label>
            <input
              type="text"
              placeholder="e.g. 682030"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-black text-slate-900 block">Pin Exact Property Location</label>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Drag the marker or search to locate the property</p>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={searchLoading}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer border-0 h-9 disabled:opacity-50"
            >
              {searchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5 text-[#014645]" />}
              Use Current Location
            </button>
          </div>

          <form onSubmit={handleMapSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for building, locality, or address..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#014645] focus:ring-2 focus:ring-[#014645]/20 transition-all font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all border-0 cursor-pointer h-9"
            >
              {searchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
            </button>

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#014645] transition-colors block border-0 bg-transparent cursor-pointer"
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div ref={mapRef} className="h-75 w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative z-10" style={{ minHeight: "320px" }} />
        </div>
      </div>

      {/* Section 6: Amenities */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">Amenities & Facilities</h2>

        <div className="flex flex-wrap gap-2">
          {availableAmenities.map((item) => {
            const selected = amenities.includes(item);
            return (
              <button
                type="button"
                key={item}
                onClick={() => handleToggleAmenity(item)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${selected ? "bg-emerald-50 border-[#014645] text-[#014645]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
              >
                {selected && <Check className="h-3 w-3" />}
                {item}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 max-w-sm">
          <input
            type="text"
            placeholder="Add custom amenity..."
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#014645] focus:border-[#014645]"
          />
          <button
            type="button"
            onClick={() => {
              const val = customAmenity.trim();
              if (val) {
                if (!availableAmenities.includes(val)) setAvailableAmenities((prev) => [...prev, val]);
                if (!amenities.includes(val)) setAmenities((prev) => [...prev, val]);
                setCustomAmenity("");
              }
            }}
            className="bg-[#014645] border-0 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-[#013534] transition-colors h-8"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Section 7: Photos & Video */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">
          <ImageIcon className="h-5 w-5 text-[#014645]" /> Photos & Video
        </h2>

        <div className="space-y-4">
          <input type="file" id="admin-property-file-input" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
          <div>
            <label
              htmlFor="admin-property-file-input"
              className="inline-flex bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-4 py-2.5 rounded-md items-center gap-1.5 cursor-pointer shadow-sm transition-all h-10"
            >
              <Plus className="h-4 w-4" /> Upload Photos
            </label>
            <p className="text-[10px] text-slate-400 font-semibold mt-1.5">You can upload multiple image files (JPEG, PNG). Max 10 photos.</p>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group rounded-md overflow-hidden border border-slate-200 h-24">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(idx)}
                    className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-90 hover:opacity-100 transition-opacity border-0 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {submitting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 pt-3 border-t border-slate-100 max-w-md">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" /> Video Link (Optional)
            </label>
            <input
              type="text"
              placeholder="YouTube URL or embed code"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
        </div>
      </div>

      {/* Section 8: Contact */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 my-0">Contact Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Phone Number *</label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">WhatsApp Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={ownerWhatsapp}
              onChange={(e) => setOwnerWhatsapp(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#014645]/20"
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <select
          value={listingStatus}
          onChange={(e) => setListingStatus(e.target.value as "draft" | "pending_review" | "live")}
          className="w-full sm:w-auto bg-white border border-slate-200 rounded-md px-3 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#014645]/20 h-10"
        >
          <option value="pending_review">Send to Review Queue</option>
          <option value="draft">Save as Draft</option>
          <option value="live">Publish Live Immediately</option>
        </select>

        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmitForm(listingStatus)}
          className="w-full sm:w-auto bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-8 py-3 rounded-md flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 border-0 h-10"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Create Property
        </button>
      </div>
    </div>
  );
};
