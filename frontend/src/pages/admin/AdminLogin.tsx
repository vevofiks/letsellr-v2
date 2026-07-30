import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
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
      let detail = "Invalid credentials or unauthorized access.";
      if (err.response?.data?.detail) {
        const rawDetail = err.response.data.detail;
        if (typeof rawDetail === "string") {
          detail = rawDetail;
        } else if (Array.isArray(rawDetail)) {
          detail = rawDetail
            .map((item: any) => (typeof item === "string" ? item : item.msg || JSON.stringify(item)))
            .join(", ");
        } else if (typeof rawDetail === "object") {
          detail = rawDetail.msg || JSON.stringify(rawDetail);
        }
      }
      setErrorMessage(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 font-sans text-slate-900 px-4 py-6 sm:py-10 overflow-y-auto">
      {/* Main Container */}
      <main className="w-full max-w-md mx-auto">
        <div className="bg-white border border-slate-200/80 shadow-md rounded-lg p-6 sm:p-8 space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>

            <Link to="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Letsellr Logo" className="h-9 w-auto shrink-0" />
              <span className="text-sm font-black tracking-tight text-slate-900 uppercase">
                LETSELLR <span className="text-[#086942]">ADMIN</span>
              </span>
            </Link>
          </div>

          {/* Headline */}
          <div className="flex flex-col items-center justify-center text-center space-y-1.5 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 -mt-1.5!">
              Admin Portal
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto text-center leading-relaxed -mt-4!">
              Sign in with your admin credentials
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-md flex items-start gap-2.5 text-xs font-semibold leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
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
                  className="w-full bg-white border border-slate-200 rounded-md pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#086942] focus:ring-2 focus:ring-[#086942]/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-white border border-slate-200 rounded-md pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#086942] focus:ring-2 focus:ring-[#086942]/20 transition-all"
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

            {/* Security Options */}
            <div className="flex items-center justify-between text-xs pt-1">
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
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#086942] hover:bg-[#065334] text-white font-bold text-sm rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Notice */}
          <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-normal">
            Confidential Administrator Area. Unauthorized access attempts are logged.
          </div>
        </div>
      </main>
    </div>
  );
};


