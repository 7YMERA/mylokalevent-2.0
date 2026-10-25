import { z } from "zod";

// Mirrors the Supabase password policy in supabase/config.toml, so users get
// a clear message before the request leaves the server.
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Tell us what to call you.")
    .max(80, "Keep it under 80 characters."),
  email,
  password: passwordSchema,
  consent: z.literal("on", {
    error: "You need to agree to the privacy notice to create an account.",
  }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  message?: string;
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

export function fieldErrors(error: z.ZodError): FormState["fieldErrors"] {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    out[key] ??= issue.message;
  }
  return out;
}
