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
const BUCKET = "event-images";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
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
  input: Buffer,
): Promise<{ bytes: Buffer } | { error: string }> {
  if (input.byteLength > MAX_IMAGE_BYTES) return { error: "imageTooLarge" };
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

  // Photos are uploaded next, straight from the browser to Storage (see
  // prepareImageUpload / finishImageUpload), so this request stays small.
  const locale = formLocale(formData);
  revalidatePath(localePath(locale, "/organiser"));
  return { message: "saved", eventId: event.id };
}

// The caller's own event, or null. RLS already limits reads to the owner (or
// public approved events), so also compare the organiser id.
async function ownEvent(eventId: string) {
  if (!new RegExp(`^${UUID}$`).test(eventId)) return null;
  const user = await getCurrentUser();
  if (!user || user.status !== "active") return null;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, organiser_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event || event.organiser_id !== user.id) return null;
  return { supabase, event };
}

export type UploadTicket = { path: string; token: string } | { error: string };

// Step 1 of a photo upload: a one-time signed URL for the original, under
// uploads/<event_id>/. The browser sends the file straight to Storage, so it
// never passes through a Server Action's 1 MB body limit (or Vercel's ~4.5 MB
// request limit).
export async function prepareImageUpload(
  eventId: string,
): Promise<UploadTicket> {
  const own = await ownEvent(eventId);
  if (!own) return { error: "notOrganiser" };

  const { count } = await own.supabase
    .from("event_images")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  if ((count ?? 0) >= MAX_IMAGES) return { error: "imageFailed" };

  const path = `uploads/${eventId}/${randomUUID()}`;
  const { data, error } = await own.supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return { error: "imageFailed" };
  return { path, token: data.token };
}

// Step 2: re-encode the uploaded original to WebP (checking its real type and
// stripping EXIF/GPS), store it under events/<event_id>/, record it, and
// delete the original.
export async function finishImageUpload(
  eventId: string,
  path: string,
  position: number,
): Promise<{ error?: string }> {
  const own = await ownEvent(eventId);
  if (!own) return { error: "notOrganiser" };
  if (!new RegExp(`^uploads/${eventId}/${UUID}$`).test(path)) {
    return { error: "imageFailed" };
  }
  const storage = own.supabase.storage.from(BUCKET);

  try {
    const { data: original, error: downloadError } =
      await storage.download(path);
    if (downloadError || !original) return { error: "imageFailed" };

    const result = await processImage(
      Buffer.from(await original.arrayBuffer()),
    );
    if ("error" in result) return { error: result.error };

    const finalPath = `events/${eventId}/${randomUUID()}.webp`;
    const { error: uploadError } = await storage.upload(
      finalPath,
      result.bytes,
      { contentType: "image/webp" },
    );
    if (uploadError) return { error: "imageFailed" };

    const { error: insertError } = await own.supabase
      .from("event_images")
      .insert({
        event_id: eventId,
        storage_path: finalPath,
        position: Math.max(0, Math.min(MAX_IMAGES - 1, Math.trunc(position))),
      });
    if (insertError) return { error: "imageFailed" };
    return {};
  } finally {
    // The unprocessed original (with its metadata) never stays stored.
    await storage.remove([path]);
  }
}
