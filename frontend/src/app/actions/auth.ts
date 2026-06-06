"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api"
import { serverApi } from "@/lib/server-api";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string;
  const inviteCode = formData.get("inviteCode") as string;
  
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null;
  const gradeLevel = formData.get("gradeLevel") as string;
  const curriculum = formData.get("curriculum") as string;
  const phone = formData.get("phone") as string;

  try {
    await api.post("/auth/register/", {
      email,
      password,
      full_name: fullName,
      role,
      invite_code: inviteCode,
      age,
      grade_level: gradeLevel,
      curriculum,
      phone
    });
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      return { error: "We're having trouble reaching our servers. Please check your internet connection and try again." };
    }
    // Specific messaging for registration codes
    if (error.message.includes("Registration Code")) {
      return { error: "The registration code you entered is invalid or has already been used. Please verify and try again." };
    }
    return { error: error.message || "We couldn't create your account. Please check your details and try again." };
  }
  
  // After registration, log them in to get tokens
  return await signIn(formData);
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  let redirectPath: string | null = null;

  try {
    const tokens: any = await api.post("/token/", {
      username: email,
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set("access_token", tokens.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });
    cookieStore.set("refresh_token", tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });

    // Fetch user profile to determine role and redirect
    const profile: any = await api.get("/profiles/me/", {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    });

    if (profile) {
      redirectPath = `/dashboard/${profile.role}`;
    } else {
      redirectPath = "/dashboard";
    }
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      return { error: "Connection error: We can't reach the login server right now. Please try again in a moment." };
    }
    // Handle 401/403 or specific auth errors
    if (error.message.includes("401") || error.message.toLowerCase().includes("no active account")) {
      return { error: "We don't recognize that email or password. Please double-check your credentials." };
    }
    return { error: error.message || "We couldn't log you in. Please check your email and password." };
  }

  if (redirectPath) {
    revalidatePath("/", "layout");
    redirect(redirectPath);
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  redirect("/login");
}

export async function changePassword(formData: FormData) {
  const old_password = formData.get("old_password") as string;
  const new_password = formData.get("new_password") as string;
  const confirm_password = formData.get("confirm_password") as string;

  if (!old_password || !new_password || !confirm_password) {
    return { error: "All fields are required." };
  }

  if (new_password !== confirm_password) {
    return { error: "Passwords do not match." };
  }

  try {
    const client = await serverApi.auth();
    await client.patch("/auth/change-password/", {
      old_password,
      new_password,
      confirm_password
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to change password." };
  }
}

export async function forgotPassword(email: string) {
  if (!email) return { error: "Email is required." };
  try {
    await api.post("/auth/forgot-password/", { email });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to send reset code." };
  }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  try {
    await api.post("/auth/reset-password/", {
      email,
      otp,
      new_password: newPassword
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reset password." };
  }
}

