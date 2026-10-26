"use server";

import { redirect } from "next/navigation";

import { localePath } from "@/i18n/config";
import {
  echoValues,
  fieldErrors,
  formLocale,
  signInSchema,
  signUpSchema,
  type FormState,
} from "@/lib/auth-schemas";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echoValues(formData);
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  const { displayName, email, password } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env().NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      // Read by the handle_new_user trigger to create the profile.
      data: {
        display_name: displayName,
        locale: formLocale(formData),
        privacy_consent: "true",
      },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "passwordWeak" }, values };
    }
    if (error.status === 429) {
      return { error: "tooManyAttempts", values };
    }
    return { error: "signUpFailed", values };
  }

  // Same message whether or not the email was already registered, so the
  // form can't be used to find out who has an account.
  return { message: "checkEmail", values: { email } };
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echoValues(formData);
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "emailNotConfirmed", values };
    }
    if (error.status === 429) {
      return { error: "tooManyAttempts", values };
    }
    return { error: "wrongCredentials", values };
  }

  redirect(localePath(formLocale(formData), "/account"));
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(localePath(formLocale(formData)));
}

export async function signInWithGoogle(formData: FormData) {
  const locale = formLocale(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // Same landing route as the email link; it exchanges the code for a
    // session. New Google users then accept the privacy notice on /welcome.
    options: { redirectTo: `${env().NEXT_PUBLIC_SITE_URL}/auth/confirm` },
  });

  redirect(
    data.url && !error ? data.url : localePath(locale, "/confirm-failed"),
  );
}

export async function acceptPrivacyNotice(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  if (formData.get("consent") !== "on") {
    return { fieldErrors: { consent: "consentRequired" } };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_privacy_notice", {
    new_locale: locale,
  });
  if (error) return { error: "generic" };

  redirect(localePath(locale, "/account"));
}
