import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientRegisterSchema } from "@/lib/validation";
import type { ClientRegisterInput } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";

export const RegisterClient: React.FC = () => {
  const { registerClient } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegisterInput>({
    resolver: zodResolver(clientRegisterSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ClientRegisterInput) => {
    try {
      await registerClient(data);
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
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-white font-sans text-black">
      {/* Outer Card Wrapper (32px padding, subtle border, shadow-sm, max-w-2xl matches partner register layout) */}
      <Card className="w-full max-w-2xl border border-slate-200 bg-white shadow-sm p-8 rounded-xl">
        {/* Content Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center">
            Register Seeker
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed text-center">
            Create an account to start looking for your perfect property.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* grid gap-5 sm:grid-cols-2 outputs 2 inputs per row on screen widths above sm */}
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                placeholder="Jane Doe"
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
                placeholder="jane@example.com"
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
              <FieldLabel htmlFor="preference_type">Looking to Buy or Rent?</FieldLabel>
              <Select onValueChange={(val: string | null) => setValue("preference_type", val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preference..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy Properties</SelectItem>
                  <SelectItem value="rent">Rent Properties</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.preference_type?.message}
              </FieldError>
            </Field>

            {/* Location */}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="location">Target Location / City</FieldLabel>
              <Input
                id="location"
                placeholder="e.g. London, UK"
                {...register("location")}
              />
              <FieldError className="text-left text-xs font-medium text-destructive">
                {errors.location?.message}
              </FieldError>
            </Field>


          </FieldGroup>

          {/* Form Actions */}
          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-semibold transition-colors border-0"
            >
              {isSubmitting ? "Sending OTP..." : "Register"}
            </Button>
            
            <div className="text-center text-sm text-slate-500">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-brand-green font-bold hover:underline ml-1 focus:outline-none"
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
