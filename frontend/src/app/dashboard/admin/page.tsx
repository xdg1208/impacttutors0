import { api } from "@/lib/api"
import { serverApi } from "@/lib/server-api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardContent from "@/components/admin/AdminDashboardContent";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string, q?: string }> }) {
  const { tab = "applications", q = "" } = await searchParams;
  const client = await serverApi.auth();
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

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

  // Role Guard
  if (profile.role !== "admin") {
    redirect(`/dashboard/${profile.role}`);
  }

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Admin Control Center</h1>
          <p className="text-muted text-sm">Manage applications, users, and academics.</p>
        </div>
        <form className="relative max-w-sm w-full" action="/dashboard/admin" method="GET">
          <input 
            type="text" 
            name="q"
            placeholder="Search everywhere..."
            defaultValue={q}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
          <input type="hidden" name="tab" value={tab} />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <button type="submit" className="hidden" />
        </form>
      </div>

      <AdminDashboardContent initialTab={tab} initialQuery={q} token={token} />
    </div>
  );
}
