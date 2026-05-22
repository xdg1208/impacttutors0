import { api } from "@/lib/api"
import { serverApi } from "@/lib/server-api";
import { redirect } from "next/navigation";

export default async function DashboardRoot() {
  const client = await serverApi.auth();
  
  let profile: any = null;
  let shouldRedirect = false;
  try {
    profile = await client.get("/profiles/me/");
  } catch (error) {
    shouldRedirect = true;
  }

  if (shouldRedirect || !profile) {
    redirect("/login");
  }

  const role = profile?.role;
  if (!role) {
    redirect("/login");
  }

  // If student/tutor and not onboarded, show onboarding animation
  if (role !== "admin" && !profile?.is_onboarded) {
    redirect("/dashboard/onboarding");
  }

  redirect(`/dashboard/${role}`);
}
