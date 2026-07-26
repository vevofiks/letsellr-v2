import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, adminLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If user is already logged in as admin, redirect to admin dashboard automatically
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        const from = (location.state as any)?.from?.pathname || "/admin-platform/dashboard";
        navigate(from, { replace: true });
      } else {
        // If logged in as non-admin, warn them
        setErrorMessage("Your current active session does not have Administrator privileges. Please sign in with an Admin account.");
      }
    }
  }, [user, navigate, location]);

  // Handle unauthorized redirect state
  useEffect(() => {
    if ((location.state as any)?.unauthorized) {
      setErrorMessage("Access Denied. Administrator authentication is required to access the Admin Platform.");
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    try {
      setLoading(true);
      const success = await adminLogin(email, password);

      if (success) {
        toast.success("Administrator authentication successful!");
        const from = (location.state as any)?.from?.pathname || "/admin-platform/dashboard";
        navigate(from, { replace: true });
      } else {
        setErrorMessage("OTP verification is required for this account. Please use standard password login.");
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      const detail = err.response?.data?.detail || "Invalid email or password. Access denied.";
      setErrorMessage(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Top Header Card */}
        <div className="text-center space-y-2">

          <div className="flex items-center justify-center gap-3 pt-2">
            <img src="/logo.png" alt="Letsellr Logo" className="h-10 w-auto" />
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Letsellr <span className="text-[#086942]">Admin</span>
            </span>
          </div>
        </div>

        {/* Main Form Container Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/80 shadow-xl space-y-6">

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Input Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@letsellr.com"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#086942] focus:ring-2 focus:ring-[#086942]/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#086942] focus:ring-2 focus:ring-[#086942]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Support Info */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-[#086942] focus:ring-[#086942] h-3.5 w-3.5"
                />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400 font-semibold text-[11px]">256-Bit SSL Encrypted</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#086942] hover:bg-[#065334] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer Security Notice */}
        <div className="text-center space-y-1 text-slate-400 text-[11px] font-medium">
          <p>© {new Date().getFullYear()} Letsellr Platform. Confidential Administrator Area.</p>
          <p>Unauthorized access attempts are logged and monitored.</p>
        </div>

      </div>
    </div>
  );
};
