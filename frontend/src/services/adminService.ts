import { api } from "@/lib/api";

export interface AdminDashboardStats {
  pending_property_reviews: number;
  pending_kyc_reviews?: number;
  open_disputes: number;
  total_users: number;
  total_properties: number;
  active_properties: number;
  seekers_count?: number;
  agencies_count?: number;
  owners_count?: number;
  admins_count?: number;
}

export interface AgencyProfile {
  id: string;
  display_name: string;
  about: string;
  logo_key?: string | null;
  banner_key?: string | null;
  areas_served: string[];
  created_at: string;
}

export interface AdminUser {
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  preference_type: string;
  location_city: string;
  location_area: string;
  verification_status: string;
  verification_note?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  agency_profile?: AgencyProfile | null;
}

export interface AdminProperty {
  id: string;
  owner_id: string;
  owner_role: string;
  title: string;
  description?: string;
  intent: string;
  category: string;
  price: number;
  price_unit?: string;
  deposit?: number;
  security_deposit?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  furnishing_status?: string;
  gender_preference?: string;
  area?: number;
  built_up_sqft?: number;
  carpet_sqft?: number;
  location_city: string;
  location_area: string;
  location_address?: string;
  location_pincode?: string;
  location_state?: string;
  latitude?: number | null;
  longitude?: number | null;
  video_link?: string | null;
  status: string;
  admin_reviewed_by?: string | null;
  admin_reviewed_at?: string | null;
  admin_review_reason?: string | null;
  ref?: string;
  ref_code?: string;
  is_featured?: boolean;
  created_at: string;
  photos?: (string | { photo_url: string; display_order?: number })[];
  amenities?: (string | { name: string; category?: string })[];
  extra_details?: any;
  owner_phone?: string;
  owner_whatsapp?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}

export interface PropertyType {
  id: string;
  slug: string;
  label: string;
  description: string;
  image_url?: string | null;
  is_active: boolean;
  allowed_roles: string[];
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface LocationData {
  id: string;
  title: string;
  google_map_url?: string | null;
  image_url?: string | null;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyReview {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface AdminNotificationSettings {
  notify_pending_users: boolean;
  notify_pending_properties: boolean;
  /** The numbers alerts are currently delivered to, in E.164. */
  whatsapp_recipients: string[];
  /** True while no numbers are saved and the server's env default is in use. */
  using_server_default: boolean;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string | null;
  phone: string;
}

export interface AdminCredentialsUpdate {
  current_password: string;
  new_email?: string;
  new_password?: string;
}

export const adminService = {
  // Get admin stats overview
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const res = await api.get<AdminDashboardStats>("/api/admin/dashboard-stats");
    return res.data;
  },

  // Get pending property approval queue
  getPendingProperties: async (): Promise<AdminProperty[]> => {
    const res = await api.get<AdminProperty[]>("/api/admin/properties/pending");
    return res.data;
  },

  // Get live properties
  getLiveProperties: async (): Promise<AdminProperty[]> => {
    const res = await api.get<AdminProperty[]>("/api/admin/properties/live");
    return res.data;
  },

  // Admin creates a listing, attributed to an owner, an agency, or the admin itself
  createProperty: async (payload: any): Promise<AdminProperty> => {
    const res = await api.post<AdminProperty>("/api/admin/properties", payload);
    return res.data;
  },

  // Toggle feature property on landing page
  toggleFeatureProperty: async (propertyId: string): Promise<AdminProperty> => {
    const res = await api.post<AdminProperty>(`/api/admin/properties/${propertyId}/toggle-feature`);
    return res.data;
  },

  // Approve a pending property listing
  approveProperty: async (propertyId: string, reason: string = "Approved by admin"): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>(`/api/admin/properties/${propertyId}/approve`, {
      reason,
    });
    return res.data;
  },

  // Reject a pending property listing
  rejectProperty: async (propertyId: string, reason: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>(`/api/admin/properties/${propertyId}/reject`, {
      reason,
    });
    return res.data;
  },

  // Edit / update any property details (including youtube link, price, location, specs, etc.)
  updateProperty: async (propertyId: string, payload: any): Promise<AdminProperty> => {
    const res = await api.patch<AdminProperty>(`/api/properties/${propertyId}`, payload);
    return res.data;
  },

  // Get all users
  getUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get<AdminUser[]>("/api/admin/users");
    return res.data;
  },

  // Update user active / suspended / inactive status
  updateUserStatus: async (userId: string, status: "active" | "suspended" | "inactive"): Promise<AdminUser> => {
    const res = await api.patch<AdminUser>(`/api/admin/users/${userId}/status`, {
      status,
    });
    return res.data;
  },

  // ── Property Types ──
  getPropertyTypes: async (): Promise<PropertyType[]> => {
    const res = await api.get<PropertyType[]>("/api/admin/property-types");
    return res.data;
  },
  createPropertyType: async (payload: Omit<PropertyType, "id" | "created_at" | "updated_at">): Promise<PropertyType> => {
    const res = await api.post<PropertyType>("/api/admin/property-types", payload);
    return res.data;
  },
  updatePropertyType: async (id: string, payload: Partial<Omit<PropertyType, "id" | "created_at" | "updated_at">>): Promise<PropertyType> => {
    const res = await api.patch<PropertyType>(`/api/admin/property-types/${id}`, payload);
    return res.data;
  },
  deletePropertyType: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/api/admin/property-types/${id}`);
    return res.data;
  },
  reorderPropertyTypes: async (items: { id: string; display_order: number }[]): Promise<PropertyType[]> => {
    const res = await api.post<PropertyType[]>("/api/admin/property-types/reorder", { items });
    return res.data;
  },
  uploadPropertyTypeImage: async (id: string, file: File): Promise<PropertyType> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<PropertyType>(`/api/admin/property-types/${id}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // ── Locations ──
  getLocations: async (): Promise<LocationData[]> => {
    const res = await api.get<LocationData[]>("/api/admin/locations");
    return res.data;
  },
  createLocation: async (payload: Omit<LocationData, "id" | "created_at" | "updated_at">): Promise<LocationData> => {
    const res = await api.post<LocationData>("/api/admin/locations", payload);
    return res.data;
  },
  updateLocation: async (id: string, payload: Partial<Omit<LocationData, "id" | "created_at" | "updated_at">>): Promise<LocationData> => {
    const res = await api.patch<LocationData>(`/api/admin/locations/${id}`, payload);
    return res.data;
  },
  deleteLocation: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/api/admin/locations/${id}`);
    return res.data;
  },
  uploadLocationImage: async (id: string, file: File): Promise<LocationData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<LocationData>(`/api/admin/locations/${id}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // ── REPORTS & REJECTED PROPERTIES ──────────────────────────────────────────

  getReports: async (): Promise<any[]> => {
    const res = await api.get("/api/admin/reports");
    return res.data;
  },

  updateReportStatus: async (reportId: string, status: "pending" | "resolved" | "dismissed"): Promise<void> => {
    const res = await api.patch(`/api/admin/reports/${reportId}/status`, null, { params: { status } });
    return res.data;
  },

  getRejectedProperties: async (): Promise<AdminProperty[]> => {
    const res = await api.get("/api/admin/properties/rejected");
    return res.data;
  },

  // ── USER LIMITS ──────────────────────────────────────────

  getUserLimit: async (userId: string): Promise<any> => {
    const res = await api.get(`/api/admin/users/${userId}/limit`);
    return res.data;
  },

  updateUserLimit: async (userId: string, payload: { msg_limit: number, reset_usage?: boolean, note: string, payment_ref?: string }): Promise<any> => {
    const res = await api.patch(`/api/admin/users/${userId}/limit`, payload);
    return res.data;
  },

  // ── PROPERTY REVIEWS ──────────────────────────────────────────

  getPropertyReviews: async (propertyId: string): Promise<PropertyReview[]> => {
    const res = await api.get<PropertyReview[]>(`/api/properties/${propertyId}/reviews`);
    return res.data;
  },

  deletePropertyReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/api/admin/reviews/${reviewId}`);
  },

  // ── SETTINGS ──────────────────────────────────────────

  getNotificationSettings: async (): Promise<AdminNotificationSettings> => {
    const res = await api.get<AdminNotificationSettings>("/api/admin/settings/notifications");
    return res.data;
  },

  updateNotificationSettings: async (
    payload: Partial<Pick<AdminNotificationSettings, "notify_pending_users" | "notify_pending_properties" | "whatsapp_recipients">>
  ): Promise<AdminNotificationSettings> => {
    const res = await api.patch<AdminNotificationSettings>("/api/admin/settings/notifications", payload);
    return res.data;
  },

  getAdminAccount: async (): Promise<AdminAccount> => {
    const res = await api.get<AdminAccount>("/api/admin/settings/account");
    return res.data;
  },

  updateAdminAccount: async (payload: AdminCredentialsUpdate): Promise<AdminAccount> => {
    const res = await api.patch<AdminAccount>("/api/admin/settings/account", payload);
    return res.data;
  },
};

