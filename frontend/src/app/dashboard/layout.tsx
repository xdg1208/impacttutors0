import { api } from "@/lib/api"
import { serverApi } from "@/lib/server-api";
import { redirect } from "next/navigation";
import { DashboardSidebar, DashboardHeader } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await serverApi.auth();
  
  const profile = await client.get("/profiles/me/").catch(() => null);
  
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar profile={profile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-section-alt/30 overflow-hidden">
        <DashboardHeader profile={profile} />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
