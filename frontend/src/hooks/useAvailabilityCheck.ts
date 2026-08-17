import { useEffect, useRef, useState } from "react";
import { checkAvailability } from "@/services/authService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface Options {
  /** Only fire the check once the field is locally valid (e.g. zod has no error for it). */
  phoneValid?: boolean;
  emailValid?: boolean;
}

/**
 * Live-checks phone/email uniqueness against the backend as the user types,
 * so registration forms can show "already registered" under the field
 * instead of only failing on submit.
 */
export function useAvailabilityCheck(
  phone: string | undefined,
  email: string | undefined,
  { phoneValid = true, emailValid = true }: Options = {}
) {
  const [rawPhoneTaken, setPhoneTaken] = useState(false);
  const [rawEmailTaken, setEmailTaken] = useState(false);
  // Values already confirmed by the backend — lets us derive "checking" without
  // a synchronous setState in the effect body (updated only from the async callback).
  const [checkedPhone, setCheckedPhone] = useState<string | null>(null);
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);

  const debouncedPhone = useDebouncedValue(phone, 500);
  const debouncedEmail = useDebouncedValue(email, 500);

  const controllerRef = useRef<AbortController | null>(null);

  const shouldCheckPhone = phoneValid && !!debouncedPhone?.trim();
  const shouldCheckEmail = emailValid && !!debouncedEmail?.trim();

  useEffect(() => {
    if (!shouldCheckPhone && !shouldCheckEmail) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    checkAvailability(
      {
        phone: shouldCheckPhone ? debouncedPhone : undefined,
        email: shouldCheckEmail ? debouncedEmail : undefined,
      },
      controller.signal
    )
      .then((result) => {
        if (shouldCheckPhone) {
          setPhoneTaken(result.phone_taken);
          setCheckedPhone(debouncedPhone ?? null);
        }
        if (shouldCheckEmail) {
          setEmailTaken(result.email_taken);
          setCheckedEmail(debouncedEmail ?? null);
        }
      })
      .catch(() => {
        // Silently ignore (including aborts) — submit-time validation still catches it.
      });

    return () => controller.abort();
  }, [debouncedPhone, debouncedEmail, shouldCheckPhone, shouldCheckEmail]);

  return {
    phoneTaken: shouldCheckPhone && rawPhoneTaken,
    emailTaken: shouldCheckEmail && rawEmailTaken,
    checkingPhone: shouldCheckPhone && checkedPhone !== debouncedPhone,
    checkingEmail: shouldCheckEmail && checkedEmail !== debouncedEmail,
  };
}
