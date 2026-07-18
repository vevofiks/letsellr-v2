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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          {/* Custom CSS loader styled with our primary teal color */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#308178]" />
          <p className="text-sm font-medium text-slate-500">Verifying session...</p>
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
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/register/type" replace />;
    }
  }

  return <>{children}</>;
};
