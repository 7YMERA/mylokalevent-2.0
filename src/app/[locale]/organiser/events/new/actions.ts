"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import sharp from "sharp";

import { localePath } from "@/i18n/config";
import { formLocale } from "@/lib/auth-schemas";
import { getCurrentUser } from "@/lib/auth";
import { eventSchema, type FormState } from "@/lib/organiser-schemas";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES = 4;
const ALLOWED = new Set(["jpeg", "png", "webp"]);

function echo(formData: FormData): FormState["values"] {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    title: text("title"),
    slug: text("slug"),
    categorySlug: text("categorySlug"),
    description: text("description"),
    startsAt: text("startsAt"),
    endsAt: text("endsAt"),
    state: text("state"),
    district: text("district"),
    venue: text("venue"),
    feeMyr: text("feeMyr"),
  };
}

// Re-encode an upload to WebP, which drops EXIF/GPS metadata, after checking
// its REAL type from the bytes (not the browser-supplied content-type) and
// its size. Returns the processed bytes, or an error key.
async function processImage(
  file: File,
): Promise<{ bytes: Buffer } | { error: string }> {
  if (file.size > MAX_IMAGE_BYTES) return { error: "imageTooLarge" };
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const pipeline = sharp(input, { failOn: "error" });
    const meta = await pipeline.metadata();
    if (!meta.format || !ALLOWED.has(meta.format)) {
      return { error: "imageWrongType" };
    }
    const bytes = await pipeline
      .rotate() // bake in orientation before we strip metadata
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    return { bytes };
  } catch {
    return { error: "imageFailed" };
  }
}

export async function saveEventDraft(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = echo(formData);

  const user = await getCurrentUser();
  if (!user) return { error: "notOrganiser", values };
  if (user.status !== "active") return { error: "generic", values };

  const supabase = await createClient();

  // Must be a verified organiser (their organiser id == their uid).
  const { data: organiser } = await supabase
    .from("organisers")
    .select("id, verification")
    .eq("id", user.id)
    .maybeSingle();
  if (!organiser || organiser.verification !== "verified") {
    return { error: "notOrganiser", values };
  }

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors, values };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", parsed.data.categorySlug)
    .eq("active", true)
    .maybeSingle();
  if (!category)
    return { fieldErrors: { categorySlug: "categoryRequired" }, values };

  // Create the draft event (RLS pins organiser_id = auth.uid(), status draft).
  const { data: event, error: insertError } = await supabase
    .from("events")
    .insert({
      slug: parsed.data.slug,
      organiser_id: user.id,
      category_id: category.id,
      title: parsed.data.title,
      description: parsed.data.description,
      starts_at: parsed.data.startsAt.toISOString(),
      ends_at: parsed.data.endsAt ? parsed.data.endsAt.toISOString() : null,
      state: parsed.data.state,
      district: parsed.data.district,
      venue: parsed.data.venue,
      fee_myr: parsed.data.feeMyr,
    })
    .select("id, slug")
    .single();

  if (insertError || !event) {
    if (insertError?.code === "23505") {
      return { fieldErrors: { slug: "slugTaken" }, values };
    }
    return { error: "generic", values };
  }

  // Process and store up to MAX_IMAGES photos.
  const files = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0)
    .slice(0, MAX_IMAGES);

  for (const [index, file] of files.entries()) {
    const result = await processImage(file);
    if ("error" in result) {
      // The event draft is saved; report the image problem so the user can retry.
      return { error: result.error, values, message: "saved" };
    }
    const path = `events/${event.id}/${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(path, result.bytes, { contentType: "image/webp" });
    if (uploadError) return { error: "imageFailed", values, message: "saved" };

    await supabase
      .from("event_images")
      .insert({ event_id: event.id, storage_path: path, position: index });
  }

  const locale = formLocale(formData);
  revalidatePath(localePath(locale, "/organiser"));
  return { message: "saved" };
}
