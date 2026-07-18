import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation";
import type { LoginInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const fromPath = (location.state as any)?.from || null;

  // Redirect user based on role upon successful login/session resolution
  useEffect(() => {
    if (user) {
      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (user.role === "user") {
        navigate("/dashboard", { replace: true });
      } else if (user.role === "owner" || user.role === "agency") {
        navigate("/owner/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate, fromPath]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password);
      toast.success("Successfully signed in!");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.detail || "Invalid email or password. Please try again."
      );
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-white font-sans text-black">
      {/* Outer Card Wrapper (32px padding, subtle border, shadow-sm) */}
      <Card className="w-full max-w-md border border-slate-200 bg-white shadow-sm p-8 rounded-xl">
        {/* Content Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed text-center">
            Enter your email and password to log in.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="grid gap-5">
            {/* Email Address */}
            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.email?.message}
              </FieldError>
            </Field>

            {/* Password */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.password?.message}
              </FieldError>
            </Field>
          </FieldGroup>

          {/* Form Actions */}
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[#308178] hover:bg-[#25645d] text-white font-semibold transition-colors"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
            
            <div className="text-center text-sm text-slate-500">
              New to Letsellr?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-[#308178] font-bold hover:underline ml-1 focus:outline-none"
              >
                Create an Account
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
