import { z } from "zod";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/messages";

// Error messages are keys into the `messages` section of src/messages/*.json,
// so the form can show them in the visitor's language.

// Mirrors the Supabase password policy in supabase/config.toml, so users get
// a clear message before the request leaves the server.
export const passwordSchema = z
  .string()
  .min(10, "passwordTooShort" satisfies MessageKey)
  .max(72, "passwordTooLong" satisfies MessageKey)
  .regex(/[a-z]/, "passwordLowercase" satisfies MessageKey)
  .regex(/[A-Z]/, "passwordUppercase" satisfies MessageKey)
  .regex(/[0-9]/, "passwordNumber" satisfies MessageKey);

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("emailInvalid" satisfies MessageKey));

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "displayNameRequired" satisfies MessageKey)
    .max(80, "displayNameTooLong" satisfies MessageKey),
  email,
  password: passwordSchema,
  consent: z.literal("on", {
    error: "consentRequired" satisfies MessageKey,
  }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "passwordRequired" satisfies MessageKey),
});

export type FormState = {
  error?: MessageKey;
  fieldErrors?: Partial<Record<string, MessageKey>>;
  message?: MessageKey;
  // Echoed back so fields keep their values after a failed submit.
  // Never includes the password.
  values?: { displayName?: string; email?: string };
};

export function echoValues(formData: FormData): FormState["values"] {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  return { displayName: text("displayName"), email: text("email") };
}

// Forms send the page's locale in a hidden field; anything else falls back.
export function formLocale(formData: FormData): Locale {
  const value = formData.get("locale");
  return isLocale(value) ? value : defaultLocale;
}

export function fieldErrors(error: z.ZodError): FormState["fieldErrors"] {
  const out: Record<string, MessageKey> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    out[key] ??= issue.message as MessageKey;
  }
  return out;
}
