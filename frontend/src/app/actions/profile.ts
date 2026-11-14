"use server";

import { serverApi } from "@/lib/server-api";
import { revalidatePath } from "next/cache";

/**
 * Lets a user update their own profile basics (full name + phone).
 * Role, onboarding state and other administrative fields are read-only
 * on the backend and cannot be changed through this action.
 */
export async function updateProfile(profileId: string, formData: FormData) {
  const full_name = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;

  if (!full_name?.trim()) {
    return { error: "Full name is required." };
  }

  const client = await serverApi.auth();
  try {
    await client.patch(`/profiles/${profileId}/`, {
      full_name: full_name.trim(),
      phone: phone?.trim() || "",
    });
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error && error.message ? error.message : "Failed to update profile.";
    return { error: message };
  }
}
