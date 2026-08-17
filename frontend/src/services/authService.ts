import { api } from "@/lib/api";

export interface AvailabilityResult {
  phone_taken: boolean;
  email_taken: boolean;
}

/**
 * Checks whether a phone number and/or email are already registered.
 * Pass only the field(s) you want checked — omitted fields come back false.
 */
export const checkAvailability = async (
  params: { phone?: string; email?: string },
  signal?: AbortSignal
): Promise<AvailabilityResult> => {
  const res = await api.get<AvailabilityResult>("/api/auth/check-availability", {
    params,
    signal,
  });
  return res.data;
};
