import { redirect } from "next/navigation";

import { AdminMobileNav, AdminSidebar } from "@/components/admin/sidebar";
import { auth } from "@/lib/auth";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/30">
      <AdminSidebar staffName={session.user.name ?? session.user.email ?? "Staff"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminMobileNav staffName={session.user.name ?? session.user.email ?? "Staff"} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
