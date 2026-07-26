import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center h-20 w-20">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-[#014645] animate-spin" />
            <img 
              src="/logo.png" 
              alt="Letsellr Logo" 
              className="h-9 w-auto z-10 animate-pulse" 
            />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
            Preparing your experience...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the current location the user was trying to access so we can redirect them back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user role is not allowed, redirect to their proper dashboard
    console.warn(`Role ${user.role} unauthorized for path ${location.pathname}`);
    if (user.role === "user") {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === "owner" || user.role === "agency") {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin-platform/dashboard" replace />;
    } else {
      return <Navigate to="/register/type" replace />;
    }
  }

  return <>{children}</>;
};
