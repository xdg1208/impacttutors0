"use server";

import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function submitStudentApplication(formData: FormData) {
  const data = {
    parent_name: formData.get("parentName"),
    student_name: formData.get("studentName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    grade_level: formData.get("gradeLevel"),
    curriculum: formData.get("curriculum"),
    subjects: formData.get("subjects")?.toString().split(",").map(s => s.trim()),
    message: formData.get("message"),
    preferred_contact_method: formData.get("preferredContactMethod"),
    contact_detail: formData.get("contactDetail"),
  };

  try {
    await api.post("/student-applications/", data);
    return { success: true };
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      return { error: "Submission error: We're having trouble connecting. Please check your internet and try again." };
    }
    return { error: error.message || "We couldn't submit your application just yet. Please review your details and try again." };
  }
}

export async function submitTutorApplication(formData: FormData) {
  const data = {
    full_name: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subjects: formData.get("subjects")?.toString().split(",").map(s => s.trim()),
    experience: formData.get("experience"),
    preferred_contact_method: formData.get("preferredContactMethod"),
    contact_detail: formData.get("contactDetail"),
  };

  try {
    await api.post("/tutor-applications/", data);
    return { success: true };
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      return { error: "Network trouble: We couldn't receive your application. Please check your connection and try again." };
    }
    return { error: error.message || "Something went wrong with your application submission. Please double-check your form and try again." };
  }
}
