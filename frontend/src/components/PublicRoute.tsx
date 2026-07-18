import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#308178]" />
          <p className="text-sm font-medium text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect authenticated users to their proper dashboard based on role
    if (user.role === "user") {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === "owner" || user.role === "agency") {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};
