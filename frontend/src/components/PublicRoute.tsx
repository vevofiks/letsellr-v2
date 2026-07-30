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
