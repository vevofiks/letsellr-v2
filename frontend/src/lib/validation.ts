import { z } from "zod";

const strictTextRegex = /^[a-zA-Z0-9](?!.*\s{2,})[a-zA-Z0-9\s.,'()\-]*$/;

const strictTextSchema = (fieldName: string, min = 2, max = 200) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .min(min, `Must be at least ${min} characters`)
    .max(max, `Must be at most ${max} characters`)
    .regex(strictTextRegex, "Invalid format. Start with letter/number.")
    .trim();

// Base rules mirroring backend constraints
const nameSchema = strictTextSchema("Name", 2, 200);

const phoneSchema = z
  .string()
  .min(7, "Must be at least 7 characters")
  .max(20, "Must be at most 20 characters")
  .regex(/^\+?[0-9](?!.*\s{2,})[0-9\s\-]*$/, "Invalid phone number format.")
  .trim();

// Optional email schema for registration forms
const optionalEmailSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((val) => {
    if (!val || val.trim() === "") return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }, "Invalid email format");

const locationSchema = strictTextSchema("Location", 2, 200);

const pinSchema = z
  .string()
  .length(4, "PIN must be exactly 4 digits")
  .regex(/^[0-9]{4}$/, "PIN must contain only numbers");

// ── Client / Seeker Registration Schema ──────────────────────────────────────
export const clientRegisterSchema = z
  .object({
    name: nameSchema,
    email: optionalEmailSchema,
    phone: phoneSchema,
    preference_type: z.string().min(1, "Please select a preference type"),
    location: locationSchema,
    pin: pinSchema,
  });

export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;

// ── Owner / Agency Registration Schema ───────────────────────────────────────
export const ownerAgencyRegisterSchema = z
  .object({
    role: z.enum(["owner", "agency"]),
    name: nameSchema,
    email: optionalEmailSchema,
    phone: phoneSchema,
    preference_type: z.string().min(1, "Please select a preference type"),
    location_city: strictTextSchema("City", 2, 100),
    location_area: strictTextSchema("Area", 2, 200),
    pin: pinSchema,
    confirm_pin: z.string().min(4, "Confirm PIN is required"),

    // Agency-only fields
    agency_display_name: z.string().optional(),
    agency_about: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        return strictTextRegex.test(val);
      }, "About description must start with a letter or digit, and contain no consecutive spaces or leading special symbols."),
    agency_areas_served: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.role === "agency") {
      if (!data.agency_display_name || data.agency_display_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["agency_display_name"],
          message: "Agency display name is required and must be at least 2 characters",
        });
      } else if (!strictTextRegex.test(data.agency_display_name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["agency_display_name"],
          message:
            "Agency name must start with a letter or digit, contain no leading/consecutive spaces, and avoid special symbols at the start.",
        });
      }
    }
    if (data.pin !== data.confirm_pin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_pin"],
        message: "PINs do not match",
      });
    }
  });

export type OwnerAgencyRegisterInput = z.infer<typeof ownerAgencyRegisterSchema>;

// ── Login Schema ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── OTP Schema ───────────────────────────────────────────────────────────────
export const otpSchema = z.object({
  otp: z
    .string()
    .min(4, "OTP must be at least 4 digits")
    .max(10, "OTP must be at most 10 digits")
    .regex(/^[0-9]+$/, "OTP must contain only numbers"),
});

export type OTPInput = z.infer<typeof otpSchema>;
