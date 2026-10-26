"use server";

import { redirect } from "next/navigation";

import { localePath } from "@/i18n/config";
import { formLocale } from "@/lib/auth-schemas";
import { getCurrentUser } from "@/lib/auth";
import { applyOrganiserSchema, type FormState } from "@/lib/organiser-schemas";
import { createClient } from "@/lib/supabase/server";

function echo(formData: FormData): FormState["values"] {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    name: text("name"),
    slug: text("slug"),
    phone: text("phone"),
    state: text("state"),
    ssmNumber: text("ssmNumber"),
  };
}

export async function applyOrganiser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echo(formData);

  const user = await getCurrentUser();
  if (!user) redirect(localePath(formLocale(formData), "/sign-in"));
  if (user.status !== "active") return { error: "generic", values };

  const parsed = applyOrganiserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors, values };
  }

  const supabase = await createClient();
  // The RLS insert policy pins id = auth.uid() and verification = 'none'.
  const { error } = await supabase.from("organisers").insert({
    id: user.id,
    slug: parsed.data.slug,
    name: parsed.data.name,
    phone: parsed.data.phone,
    state: parsed.data.state,
    ssm_number: parsed.data.ssmNumber ?? null,
  });

  if (error) {
    // 23505 = unique violation (slug or an existing application).
    if (error.code === "23505") {
      return { fieldErrors: { slug: "slugTaken" }, values };
    }
    return { error: "generic", values };
  }

  return { message: "success" };
}
