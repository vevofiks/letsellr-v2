import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely extracts a clean, human-readable error message from an API error or unknown error.
 * Handles FastAPI string details, FastAPI validation error arrays ([{loc, msg, ...}]),
 * Axios errors, and generic JavaScript Error objects.
 */
export function getErrorMessage(error: any, fallback: string = "An unexpected error occurred. Please try again."): string {
  if (!error) return fallback;

  // If error is already a clean string
  if (typeof error === "string") return error;

  // Extract response detail from Axios / FastAPI
  const detail = error.response?.data?.detail ?? error.data?.detail ?? error.detail;

  if (typeof detail === "string") {
    // Hide technical DB / Python tracebacks
    if (detail.includes("IntegrityError") || detail.includes("UniqueViolation") || detail.includes("psycopg2")) {
      return "A record with these details already exists. Please check your input.";
    }
    if (detail.includes("Internal Server Error") || detail.includes("Traceback (most recent call last)")) {
      return fallback;
    }
    return detail;
  }

  // FastAPI 422 Validation Error Array: [{ loc: ['body', 'field_name'], msg: 'error message' }]
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const loc = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
          const msg = item.msg || "Invalid value";
          if (loc && loc !== "body" && loc !== "query" && loc !== "path") {
            const fieldName = String(loc)
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            return `${fieldName}: ${msg}`;
          }
          return msg;
        }
        return null;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  // Object detail fallback
  if (detail && typeof detail === "object" && typeof detail.msg === "string") {
    return detail.msg;
  }

  // Axios response message
  if (typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }

  // General Error message
  if (typeof error.message === "string" && !error.message.includes("Request failed with status code")) {
    return error.message;
  }

  return fallback;
}

/**
 * Retrieves or generates a persistent visitor token stored in localStorage
 * for deduplicating views and leads from guest/anonymous visitors.
 */
export function getVisitorToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("letsellr_visitor_token");
  if (!token) {
    token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("letsellr_visitor_token", token);
  }
  return token;
}
