import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface UserProfile {
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  preference_type: string;
  location_city: string;
  location_area: string;
  verification_status: string;
  status: string;
  agency_profile?: {
    display_name: string;
    about: string;
    logo_key: string | null;
    areas_served: string[];
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  adminLogin: (email: string, password?: string) => Promise<boolean>;
  verifyLogin: (email: string, otp: string) => Promise<void>;
  registerOwnerAgency: (data: any) => Promise<void>;
  registerClient: (data: any) => Promise<void>;
  verifyRegistration: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  fetchFullProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to load the current user profile from /api/auth/me
  const loadUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<UserProfile>("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load user session", err);
      // In case of error (and failed automatic refresh), clear session
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Listen to standard logout events from the API client or reload
  useEffect(() => {
    loadUser();

    const handleLogoutEvent = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener("auth-logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("auth-logout", handleLogoutEvent);
    };
  }, []);

  // Initiate Login (Password or OTP)
  const login = async (email: string, password?: string): Promise<boolean> => {
    const res = await api.post("/api/auth/login", { email, password });
    
    // If we receive an access token, it was a direct password login
    if (res.data.access_token) {
      const { access_token, refresh_token, user: userData } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(userData);
      return true; // logged in directly
    }
    
    // Otherwise it was an OTP request
    return false; // OTP required
  };

  // Initiate Admin Login (Password or OTP - strict admin role validation)
  const adminLogin = async (email: string, password?: string): Promise<boolean> => {
    const res = await api.post("/api/auth/admin/login", { email, password });
    
    if (res.data.access_token) {
      const { access_token, refresh_token, user: userData } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(userData);
      return true;
    }
    
    return false;
  };

  // Step 2: Verify Login (legacy/fallback)
  const verifyLogin = async (email: string, otp: string) => {
    const res = await api.post("/api/auth/verify-login", { email, otp });
    const { access_token, refresh_token, user: userData } = res.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setUser(userData);
  };

  // Step 1: Initiate Owner/Agency Registration
  const registerOwnerAgency = async (data: any) => {
    const { confirm_password, ...payload } = data;
    await api.post("/api/auth/register", payload);
  };

  // Step 1: Initiate Client/Seeker Registration
  const registerClient = async (data: any) => {
    const { confirm_password, ...payload } = data;
    await api.post("/api/auth/register/user", payload);
  };

  // Step 2: Verify Registration
  const verifyRegistration = async (email: string, otp: string) => {
    const res = await api.post("/api/auth/verify-registration", { email, otp });
    const { access_token, refresh_token, user: userData } = res.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setUser(userData);
  };

  // Fetch full profile from /api/users/me (includes agency profile)
  const fetchFullProfile = async () => {
    try {
      const res = await api.get<UserProfile>("/api/users/me");
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to load full profile details", err);
      return null;
    }
  };

  // Handle Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        verifyLogin,
        registerOwnerAgency,
        registerClient,
        verifyRegistration,
        logout,
        fetchFullProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
