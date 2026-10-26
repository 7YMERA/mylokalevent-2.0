"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ToggleState = {
  saved?: boolean;
  following?: boolean;
  error?: string;
};

// Toggle a saved event for the current user. Returns the new state.
export async function toggleSaveEvent(
  _prev: ToggleState,
  formData: FormData,
): Promise<ToggleState> {
  const eventId = formData.get("eventId");
  const currentlySaved = formData.get("current") === "true";
  if (typeof eventId !== "string" || !eventId) return { error: "generic" };

  const user = await getCurrentUser();
  if (!user) return { error: "signInRequired" };

  const supabase = await createClient();
  if (currentlySaved) {
    const { error } = await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", eventId);
    if (error) return { error: "generic", saved: true };
  } else {
    const { error } = await supabase
      .from("saved_events")
      .insert({ user_id: user.id, event_id: eventId });
    if (error) return { error: "generic", saved: false };
  }
  return { saved: !currentlySaved };
}

// Toggle following an organiser for the current user.
export async function toggleFollowOrganiser(
  _prev: ToggleState,
  formData: FormData,
): Promise<ToggleState> {
  const organiserId = formData.get("organiserId");
  const currentlyFollowing = formData.get("current") === "true";
  if (typeof organiserId !== "string" || !organiserId) {
    return { error: "generic" };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "signInRequired" };

  const supabase = await createClient();
  if (currentlyFollowing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("user_id", user.id)
      .eq("organiser_id", organiserId);
    if (error) return { error: "generic", following: true };
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ user_id: user.id, organiser_id: organiserId });
    if (error) return { error: "generic", following: false };
  }
  return { following: !currentlyFollowing };
}

// Toggle the reminder flag on a saved event.
export async function toggleReminder(
  _prev: ToggleState,
  formData: FormData,
): Promise<ToggleState> {
  const eventId = formData.get("eventId");
  const remind = formData.get("remind") === "true";
  if (typeof eventId !== "string" || !eventId) return { error: "generic" };

  const user = await getCurrentUser();
  if (!user) return { error: "signInRequired" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_events")
    .update({ remind: !remind })
    .eq("user_id", user.id)
    .eq("event_id", eventId);
  if (error) return { error: "generic" };

  revalidatePath("/", "layout");
  return {};
}
