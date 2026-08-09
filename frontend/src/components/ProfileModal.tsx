import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  X,
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  Building2, 
  BookOpen, 
  Briefcase,
  Camera,
  Edit2,
  Lock,
  Save,
  Undo2,
  Navigation
} from "lucide-react";

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { fetchFullProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [preference, setPreference] = useState("");

  // Live Validation Error States
  const [nameError, setNameError] = useState("");
  const [cityError, setCityError] = useState("");

  // Base64 image states
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const DEFAULT_BANNER = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

  useEffect(() => {
    const loadProfileData = async () => {
      const data = await fetchFullProfile();
      if (data) {
        setProfile(data);
        setName(data.name || "");
        setCity(data.location_city || "");
        setPreference(data.preference_type || "");

        // Load persisted images from localStorage
        const savedBanner = localStorage.getItem(`profile_banner_${data.id}`);
        const savedAvatar = localStorage.getItem(`profile_avatar_${data.id}`);
        if (savedBanner) setBannerUrl(savedBanner);
        if (savedAvatar) setAvatarUrl(savedAvatar);
      } else {
        toast.error("Failed to load profile details.");
      }
      setLoading(false);
    };

    loadProfileData();
  }, []);

  // Live Validation Rules
  const validateName = (val: string) => {
    if (!val.trim()) return "Name is required";
    if (val.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s\-]+$/.test(val)) return "Name can only contain letters, spaces, and hyphens";
    return "";
  };

  const validateCity = (val: string) => {
    if (!val.trim()) return "City is required";
    return "";
  };

  // Change handlers with live validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setNameError(validateName(val));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCity(val);
    setCityError(validateCity(val));
  };



  // Geolocation detection and reverse geocoding via OpenStreetMap Nominatim API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          localStorage.setItem("user_lat", latitude.toString());
          localStorage.setItem("user_lng", longitude.toString());

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

          let resolvedLocation = "";
          if (cityVal && stateVal) {
            resolvedLocation = `${cityVal}, ${stateVal}`;
          } else {
            resolvedLocation = cityVal || stateVal || "";
          }

          if (resolvedLocation) {
            setCity(resolvedLocation);
            setCityError("");
            toast.success(`Location detected: ${resolvedLocation}`);
          } else {
            toast.error("Could not determine location details from coordinates.");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error("Failed to resolve city name.");
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        toast.error("Failed to detect location: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSave = async () => {
    const nErr = validateName(name);
    const cErr = validateCity(city);
    if (nErr || cErr) {
      setNameError(nErr);
      setCityError(cErr);
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<UserProfile>("/api/users/me", {
        name: name.trim(),
        location_city: city.trim(),
        preference_type: preference
      });
      setProfile(res.data);
      await fetchFullProfile(); // refresh auth context
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setName(profile.name || "");
      setCity(profile.location_city || "");
      setPreference(profile.preference_type || "");
    }
    setNameError("");
    setCityError("");
    setIsEditing(false);
  };

  // File Upload Handlers
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && profile) {
        localStorage.setItem(`profile_banner_${profile.id}`, dataUrl);
        setBannerUrl(dataUrl);
        toast.success("Profile banner updated!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && profile) {
        localStorage.setItem(`profile_avatar_${profile.id}`, dataUrl);
        setAvatarUrl(dataUrl);
        window.dispatchEvent(new Event("profile-updated"));
        toast.success("Profile avatar updated!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Label Formatter for Preference
  const formatPreference = (type: string) => {
    if (type === "both") return "Buy & Rent";
    if (type === "buy") return "Buy";
    if (type === "rent") return "Rent";
    return type || "None";
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close overlay */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Hidden file uploaders */}
      <input 
        type="file" 
        id="banner-file-input" 
        accept="image/*" 
        className="hidden" 
        onChange={handleBannerUpload} 
      />
      <input 
        type="file" 
        id="avatar-file-input" 
        accept="image/*" 
        className="hidden" 
        onChange={handleAvatarUpload} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-slate-150 z-10 my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Top Banner Image Area */}
        <div className="relative h-28 bg-slate-100 overflow-hidden group">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <img src={DEFAULT_BANNER} alt="Default Banner" className="h-full w-full object-cover opacity-90" />
          )}

          {/* Banner Edit overlay */}
          <label 
            htmlFor="banner-file-input"
            className="absolute bottom-2.5 right-2.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-900/70 hover:bg-slate-900 text-white cursor-pointer shadow-md transition-all opacity-80 hover:opacity-100"
            title="Upload Banner"
          >
            <Camera className="h-3.5 w-3.5" />
          </label>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 transition-all shadow-sm cursor-pointer border border-slate-100 z-10"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 pb-6 pt-2 relative text-left">
          
          {/* Avatar overlay */}
          <div className="absolute -top-12 left-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-brand-deep-green text-white text-xl font-black uppercase shadow-md overflow-hidden group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span>{profile?.name ? profile.name.slice(0, 2) : "US"}</span>
            )}

            {/* Avatar edit overlay icon */}
            <label 
              htmlFor="avatar-file-input"
              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Upload Avatar"
            >
              <Camera className="h-4 w-4" />
            </label>
          </div>

          <div className="h-10" />

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-deep-green" />
              <p className="text-xs font-semibold text-slate-500">Loading details...</p>
            </div>
          ) : !profile ? (
            <div className="py-6 text-center">
              <p className="text-sm font-bold text-slate-500">Failed to load details.</p>
              <button 
                onClick={onClose}
                className="mt-3 text-xs font-black text-brand-deep-green underline"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Header Info */}
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {isEditing ? "Edit Profile" : profile.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                    <Briefcase className="h-3.5 w-3.5 text-brand-deep-green/60" />
                    <span>{profile.role} Account</span>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-brand-deep-green hover:bg-brand-light-green border border-brand-green/20 rounded-full px-3 py-1 cursor-pointer transition-all shadow-xs"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>

              {/* Editing Form OR Info View */}
              {isEditing ? (
                <div className="space-y-3.5 max-h-75 overflow-y-auto pr-1">
                  
                  {/* Name field */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      className={`mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 border ${nameError ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 focus:ring-brand-deep-green/20 focus:border-brand-deep-green"} rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-4 transition-all`}
                      placeholder="Enter full name"
                    />
                    {nameError && (
                      <p className="mt-1 text-[10px] font-bold text-rose-500">{nameError}</p>
                    )}
                  </div>

                  {/* City Location field */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Location City</label>
                    <div className="relative mt-1.5 flex gap-2">
                      <input
                        type="text"
                        value={city}
                        onChange={handleCityChange}
                        className={`flex-1 px-3.5 py-2.5 bg-slate-50 border ${cityError ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 focus:ring-brand-deep-green/20 focus:border-brand-deep-green"} rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-4 transition-all`}
                        placeholder="Enter preferred city"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={gpsLoading}
                        className="flex items-center justify-center p-2.5 bg-brand-light-green hover:bg-brand-light-green/80 text-brand-deep-green border border-brand-green/20 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                        title="Detect current location"
                      >
                        {gpsLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-deep-green border-t-transparent" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {cityError && (
                      <p className="mt-1 text-[10px] font-bold text-rose-500">{cityError}</p>
                    )}
                  </div>

                  {/* Preference Select */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Interest Type</label>
                    <select
                      value={preference}
                      onChange={(e) => setPreference(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:ring-brand-deep-green/20 focus:border-brand-deep-green rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-4 transition-all"
                    >
                      <option value="buy">Buy</option>
                      <option value="rent">Rent</option>
                      <option value="both">Buy & Rent</option>
                    </select>
                  </div>

                  {/* Locked Email Block */}
                  <div className="opacity-70 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      Email Address <Lock className="h-2.5 w-2.5 text-slate-400" />
                    </label>
                    <input
                      type="text"
                      value={profile.email}
                      disabled
                      className="mt-1.5 w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  {/* Locked Phone Block */}
                  <div className="opacity-70 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      Phone Number <Lock className="h-2.5 w-2.5 text-slate-400" />
                    </label>
                    <input
                      type="text"
                      value={profile.phone || "Not provided"}
                      disabled
                      className="mt-1.5 w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed"
                    />
                  </div>

                </div>
              ) : (
                <div className="space-y-3">
                  
                  {/* Location display */}
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-brand-deep-green shrink-0" />
                    <span>{profile.location_city || "No location city"}</span>
                  </div>

                  {/* Data list */}
                  <div className="space-y-2.5 pt-1.5">
                    <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <Mail className="h-4.5 w-4.5 text-brand-deep-green shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                        <p className="text-xs font-extrabold text-slate-800 truncate">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <Phone className="h-4.5 w-4.5 text-brand-deep-green shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                        <p className="text-xs font-extrabold text-slate-800">{profile.phone || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <Sparkles className="h-4.5 w-4.5 text-brand-deep-green shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Preference</p>
                        <span className="inline-flex rounded-full bg-brand-light-green px-2 py-0.5 text-[10px] font-extrabold text-brand-deep-green capitalize mt-0.5">
                          {formatPreference(profile.preference_type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agency Details */}
                  {profile.role === "agency" && profile.agency_profile && (
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-brand-deep-green" /> Agency Details
                      </h3>
                      <div className="bg-brand-light-green/20 border border-brand-green/20 rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div>
                          <p className="text-[8px] font-bold text-brand-deep-green uppercase tracking-wider">Name</p>
                          <p className="font-extrabold text-slate-800 mt-0.5">{profile.agency_profile.display_name}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> About
                          </p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">
                            {profile.agency_profile.about || "No profile bio has been written yet."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Actions row */}
              {isEditing && (
                <div className="flex gap-2.5 pt-4 border-t border-slate-100 mt-5">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black py-2.5 rounded-full cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !!nameError || !!cityError}
                    className="flex-1 bg-brand-deep-green hover:bg-brand-deep-green/90 text-white text-xs font-black py-2.5 rounded-full cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-0"
                  >
                    {saving ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Changes
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
