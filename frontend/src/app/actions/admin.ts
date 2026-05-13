"use server";

import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function approveApplication(applicationId: string, type: 'student' | 'tutor') {
  const client = await api.auth();
  const endpoint = type === 'student' ? 'student-applications' : 'tutor-applications';
  try {
    await client.post(`/${endpoint}/${applicationId}/approve/`);
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function rejectApplication(id: string, type: 'student' | 'tutor') {
  const client = await api.auth();
  const endpoint = type === 'student' ? 'student-applications' : 'tutor-applications';
  try {
    await client.post(`/${endpoint}/${id}/reject/`);
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function generateInviteCode(formData: FormData) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as 'student' | 'tutor';
  const applicationId = formData.get("applicationId") as string;
  
  const client = await api.auth();
  try {
    const payload: any = { 
      target_email: email || null,
      role: role
    };

    if (applicationId) {
      if (role === 'student') payload.student_application = applicationId;
      else payload.tutor_application = applicationId;
    }

    const data: any = await client.post("/invites/", payload);
    revalidatePath("/dashboard/admin");
    return { success: true, code: data.code };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteInviteCode(codeId: string) {
  const client = await api.auth();
  try {
    await client.delete(`/invites/${codeId}/`);
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createCourse(formData: FormData) {
  const title = formData.get("title") as string;
  const subject = formData.get("subject") as string;
  const studentIds = formData.getAll("studentIds") as string[];
  const tutorId = formData.get("tutorId") as string;
  const meetLink = formData.get("meetLink") as string;

  if (!title || !subject) return { error: "Title and subject are required." };

  const client = await api.auth();
  try {
    await client.post("/courses/", {
      title,
      subject,
      students: studentIds,
      tutor: tutorId || null,
      meet_link: meetLink || null,
      status: "active",
      category: subject,
      description: title,
      slug: title.toLowerCase().replace(/ /g, '-') + '-' + Date.now(),
    });

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCourse(courseId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const subject = formData.get("subject") as string;
  const studentIds = formData.getAll("studentIds") as string[];
  const tutorId = formData.get("tutorId") as string;
  const meetLink = formData.get("meetLink") as string;

  const client = await api.auth();
  try {
    await client.patch(`/courses/${courseId}/`, {
      title,
      subject,
      students: studentIds,
      tutor: tutorId || null,
      meet_link: meetLink || null,
    });

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createSession(formData: FormData) {
  const courseId = formData.get("courseId") as string;
  const title = formData.get("title") as string;
  const startTime = formData.get("startTime") as string;
  const duration = parseInt(formData.get("duration") as string) || 60;
  const meetLink = formData.get("meetLink") as string;

  if (!courseId || !title || !startTime) return { error: "Course, title, and start time are required." };

  const client = await api.auth();
  try {
    await client.post("/sessions/", {
      course: courseId,
      title,
      start_time: startTime,
      duration_minutes: duration,
      meet_link: meetLink || null,
      status: "scheduled",
    });

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function toggleOnboardingStatus(userId: string, status: boolean) {
  const client = await api.auth();
  try {
    await client.post(`/profiles/${userId}/toggle_onboarding/`, { is_onboarded: status });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function activateAndEnroll(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const tutorId = formData.get("tutorId") as string;
  const courseTitle = formData.get("courseTitle") as string;
  const subject = formData.get("courseTitle") as string;
  
  const client = await api.auth();
  try {
    // 1. Activate Profile
    await client.post(`/profiles/${studentId}/toggle_onboarding/`, { is_onboarded: true });
    
    // 2. Create Course (if provided)
    if (courseTitle && tutorId) {
       await client.post("/courses/", {
          title: courseTitle,
          subject: subject || "Academic",
          students: [studentId],
          tutor: tutorId,
          status: "active",
          category: "Academic",
          description: `Personalized tutoring for ${courseTitle}`,
          slug: `${courseTitle.toLowerCase().replace(/ /g, '-')}-${Date.now()}`
       });
    }
    
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
