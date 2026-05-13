"use server";

import { api } from "@/lib/api";

export async function submitContactMessage(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !subject || !message) {
    return { error: "All fields are required." };
  }

  try {
    await api.post("/contact-messages/", {
      name,
      email,
      subject,
      message
    });
    return { success: true };
  } catch (error: any) {
    console.error("Contact submission error:", error);
    return { error: error.message || "Failed to send message. Please try again later." };
  }
}
