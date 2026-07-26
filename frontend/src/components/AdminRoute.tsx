import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md">
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-[#086942] animate-spin" />
            <img 
              src="/logo.png" 
              alt="Letsellr Admin" 
              className="h-8 w-auto z-10 animate-pulse" 
            />
          </div>
          <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            Authenticating Admin Portal...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to Admin Login
  if (!user) {
    return <Navigate to="/admin-platform/login" state={{ from: location }} replace />;
  }

  // Logged in but not an administrator -> Redirect to Admin Login with unauthorized state
  if (user.role !== "admin") {
    console.warn(`Non-admin user (${user.role}: ${user.email}) attempted to access ${location.pathname}`);
    return <Navigate to="/admin-platform/login" state={{ unauthorized: true, from: location }} replace />;
  }

  return <>{children}</>;
};
