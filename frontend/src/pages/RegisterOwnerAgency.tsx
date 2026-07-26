import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ownerAgencyRegisterSchema } from "@/lib/validation";
import type { OwnerAgencyRegisterInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { Building2, User, Plus, X } from "lucide-react";

export const RegisterOwnerAgency: React.FC = () => {
  const { registerOwnerAgency } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get initial role from state if routed from welcome role cards
  const defaultRole = location.state?.defaultRole === "agency" ? "agency" : "owner";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OwnerAgencyRegisterInput>({
    resolver: zodResolver(ownerAgencyRegisterSchema),
    mode: "onChange",
    defaultValues: {
      role: defaultRole,
      agency_areas_served: [],
      preference_type: "",
    },
  });

  const selectedRole = watch("role");
  const areas = watch("agency_areas_served") || [];
  const [areaInput, setAreaInput] = useState("");

  const addArea = () => {
    if (!areaInput.trim()) return;
    if (areas.includes(areaInput.trim())) {
      toast.warning("Area is already added");
      return;
    }
    setValue("agency_areas_served", [...areas, areaInput.trim()]);
    setAreaInput("");
  };

  const removeArea = (indexToRemove: number) => {
    setValue(
      "agency_areas_served",
      areas.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const onSubmit = async (data: OwnerAgencyRegisterInput) => {
    try {
      await registerOwnerAgency(data);
      toast.success("OTP sent to your email!");
      navigate("/verify-otp", {
        state: { email: data.email, purpose: "registration" },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Registration failed. Check your inputs.");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-3 py-6 sm:p-6 bg-white font-sans text-black">
      {/* Outer Card Wrapper (responsive padding, subtle border, shadow-sm) */}
      <Card className="w-full max-w-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-8 rounded-xl">
        {/* Content Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center">
            Register Property Partner
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed text-center">
            Create an account to start listing your properties on Letsellr.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            {/* Role Selection */}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="role-select">Partner Role</FieldLabel>
              <div id="role-select" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <div
                  onClick={() => setValue("role", "owner")}
                  className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border p-4 transition-all duration-200 h-14 ${
                    selectedRole === "owner"
                      ? "border-brand-green bg-brand-light-green text-brand-deep-green"
                      : "border-slate-200 hover:bg-slate-50 text-slate-500 bg-white"
                  }`}
                >
                  <User className={`h-5 w-5 ${selectedRole === "owner" ? "text-brand-deep-green" : "text-slate-500"}`} />
                  <span className="font-semibold text-sm">Individual Owner</span>
                </div>
                <div
                  onClick={() => setValue("role", "agency")}
                  className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border p-4 transition-all duration-200 h-14 ${
                    selectedRole === "agency"
                      ? "border-brand-green bg-brand-light-green text-brand-deep-green"
                      : "border-slate-200 hover:bg-slate-50 text-slate-500 bg-white"
                  }`}
                >
                  <Building2 className={`h-5 w-5 ${selectedRole === "agency" ? "text-brand-deep-green" : "text-slate-500"}`} />
                  <span className="font-semibold text-sm">Agency / Broker</span>
                </div>
              </div>
            </Field>

            {/* Name */}
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.name?.message}
              </FieldError>
            </Field>

            {/* Email */}
            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.email?.message}
              </FieldError>
            </Field>

            {/* Phone */}
            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                {...register("phone")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.phone?.message}
              </FieldError>
            </Field>

            {/* Preference Type */}
            <Field>
              <FieldLabel htmlFor="preference_type">Listing Purpose</FieldLabel>
              <Select onValueChange={(val: string | null) => setValue("preference_type", val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sell">Sell Properties</SelectItem>
                  <SelectItem value="rent">Rent Properties</SelectItem>
                  <SelectItem value="both">Both Sell & Rent</SelectItem>
                </SelectContent>
              </Select>
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.preference_type?.message}
              </FieldError>
            </Field>

            {/* Location City */}
            <Field>
              <FieldLabel htmlFor="location_city">City</FieldLabel>
              <Input
                id="location_city"
                placeholder="e.g. Dubai"
                {...register("location_city")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.location_city?.message}
              </FieldError>
            </Field>

            {/* Location Area */}
            <Field>
              <FieldLabel htmlFor="location_area">Operating Area / Neighborhood</FieldLabel>
              <Input
                id="location_area"
                placeholder="e.g. Downtown Dubai"
                {...register("location_area")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.location_area?.message}
              </FieldError>
            </Field>
            {/* Password */}
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.password?.message}
              </FieldError>
            </Field>

            {/* Confirm Password */}
            <Field>
              <FieldLabel htmlFor="confirm_password">Confirm Password</FieldLabel>
              <Input
                id="confirm_password"
                type="password"
                placeholder="••••••••"
                {...register("confirm_password")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.confirm_password?.message}
              </FieldError>
            </Field>

            {/* Conditional Agency Fields */}
            {selectedRole === "agency" && (
              <div className="col-span-1 sm:col-span-2 mt-2">
                {/* Agency Details Card (responsive padding, border, radius) */}
                <Card className="border border-slate-200 bg-white p-4 sm:p-6 rounded-xl shadow-sm space-y-4 sm:space-y-6">
                  {/* Active-role style accent bar for header */}
                  <div className="border-b-4 border-b-brand-green pb-1.5 w-fit">
                    <h3 className="text-xs font-bold text-brand-deep-green uppercase tracking-wider">
                      Agency Profile Details
                    </h3>
                  </div>

                  <FieldGroup className="grid gap-5">
                    <Field>
                      <FieldLabel htmlFor="agency_display_name">Agency Name</FieldLabel>
                      <Input
                        id="agency_display_name"
                        placeholder="Premium Realty Group"
                        {...register("agency_display_name")}
                      />
                      <FieldError className="text-left text-xs font-medium text-destructive">
                        {errors.agency_display_name?.message}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="agency_about">About Agency</FieldLabel>
                      <Input
                        id="agency_about"
                        placeholder="Tell clients about your expertise..."
                        {...register("agency_about")}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="agency_areas_served">Areas Served</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="agency_areas_served"
                          value={areaInput}
                          onChange={(e) => setAreaInput(e.target.value)}
                          placeholder="e.g. Marina Dubai"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addArea();
                            }
                          }}
                        />
                        <Button type="button" onClick={addArea} className="bg-brand-green hover:bg-brand-green-hover text-white h-11 px-4 rounded-xl border-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {areas.map((area, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-light-green px-3 py-1 text-xs font-semibold text-brand-deep-green"
                          >
                            {area}
                            <button
                              type="button"
                              onClick={() => removeArea(index)}
                              className="text-brand-deep-green/80 hover:text-brand-deep-green"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </Field>
                  </FieldGroup>
                </Card>
              </div>
            )}
          </FieldGroup>

          {/* Form Actions */}
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-semibold transition-colors border-0"
            >
              {isSubmitting ? "Sending OTP..." : "Register Account"}
            </Button>
            
            <div className="text-center text-sm text-slate-500">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-brand-deep-green font-bold hover:underline ml-1 focus:outline-none"
              >
                Sign In
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
