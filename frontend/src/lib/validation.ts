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

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .toLowerCase()
  .trim()
  .refine((val) => {
    const domain = val.split("@")[1];
    if (!domain) return false;

    // 1. Block known disposable email domains
    const disposableDomains = [
      "mailinator.com",
      "tempmail.com",
      "dispostable.com",
      "10minutemail.com",
      "guerrillamail.com",
      "sharklasers.com",
      "getnada.com",
      "boun.cr",
      "maildrop.cc",
    ];
    if (disposableDomains.some((d) => domain.includes(d))) {
      return false;
    }

    // 2. Allow common personal email providers
    const majorProviders = [
      "gmail.com",
      "outlook.com",
      "yahoo.com",
      "hotmail.com",
      "icloud.com",
      "aol.com",
      "zoho.com",
      "protonmail.com",
      "proton.me",
      "live.com",
      "yandex.com",
      "mail.com",
      "gmx.com",
      "msn.com",
    ];
    if (majorProviders.includes(domain)) {
      return true;
    }

    // 3. Verify corporate domain suffixes/TLDs
    const standardTldRegex =
      /\.(com|org|net|edu|gov|co|io|in|uk|ae|us|me|dev|tech|ai|biz|ca|au|fr|de)$/;
    if (!standardTldRegex.test(domain)) {
      return false;
    }

    // No auto-generated or suspicious random domains
    const cleanDomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,6}$/;
    return cleanDomainRegex.test(domain);
  }, "Use a trusted/verified email provider.");

const locationSchema = strictTextSchema("Location", 2, 200);

const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .max(100, "Must be at most 100 characters")
  .regex(/[A-Z]/, "Requires an uppercase letter")
  .regex(/[a-z]/, "Requires a lowercase letter")
  .regex(/[0-9]/, "Requires a number")
  .regex(/[^A-Za-z0-9]/, "Requires a special character");

// ── Client / Seeker Registration Schema ──────────────────────────────────────
export const clientRegisterSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    preference_type: z.string().min(1, "Please select a preference type"),
    location: locationSchema,
  });

export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;

// ── Owner / Agency Registration Schema ───────────────────────────────────────
export const ownerAgencyRegisterSchema = z
  .object({
    role: z.enum(["owner", "agency"]),
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    preference_type: z.string().min(1, "Please select a preference type"),
    location_city: strictTextSchema("City", 2, 100),
    location_area: strictTextSchema("Area", 2, 200),
    password: passwordSchema,
    confirm_password: z.string().min(8, "Confirm password is required"),

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
    if (data.password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
  });

export type OwnerAgencyRegisterInput = z.infer<typeof ownerAgencyRegisterSchema>;

// ── Login Schema ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().optional(),
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
