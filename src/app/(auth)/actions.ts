"use server";

import { redirect } from "next/navigation";

import {
  echoValues,
  fieldErrors,
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
        locale: "en",
        privacy_consent: "true",
      },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: error.message }, values };
    }
    if (error.status === 429) {
      return {
        error: "Too many attempts. Please wait a minute and try again.",
        values,
      };
    }
    return {
      error: "We couldn't create your account. Please try again.",
      values,
    };
  }

  // Same message whether or not the email was already registered, so the
  // form can't be used to find out who has an account.
  return {
    message: `Check ${email} for a link to confirm your account.`,
  };
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
      return {
        error: "Please confirm your email first. Check your inbox.",
        values,
      };
    }
    if (error.status === 429) {
      return {
        error: "Too many attempts. Please wait a minute and try again.",
        values,
      };
    }
    return { error: "That email and password don't match.", values };
  }

  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
