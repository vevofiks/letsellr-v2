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

  const isPendingOrUnverified =
    user.status === "suspended" ||
    user.status === "pending" ||
    ((user.role === "owner" || user.role === "agency") && user.verification_status !== "verified");

  if (isPendingOrUnverified) {
    const { logout } = useAuth();
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
          <div className="h-20 w-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border-[6px] border-amber-100/50 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account Under Review</h2>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto">
            Your <span className="capitalize font-bold text-slate-800">{user.role}</span> account details are currently under review by our administration team. You will be granted full access to your dashboard once an administrator verifies and approves your account.
          </p>
          <div className="pt-6">
            <button 
              onClick={logout} 
              className="text-xs font-bold text-slate-400 hover:text-slate-600 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Sign out & return to home
            </button>
          </div>
        </div>
      </div>
    );
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
