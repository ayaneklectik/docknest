import { AdminConsoleShell } from "@/components/admin-console-shell";
import { adminNavigationGroups } from "@/lib/admin-navigation";
import { getSignedInStaffSession } from "@backend/admin-session";
import { getSiteContent } from "@backend/site-content";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSignedInStaffSession();
  const brandName = getSiteContent().brand.name;
  const groups = session ? adminNavigationGroups : [];

  return (
    <div className="admin-route">
      <AdminConsoleShell
        brandName={brandName}
        groups={groups}
        userName={session?.user.name ?? "Administrator"}
      >
        {children}
      </AdminConsoleShell>
    </div>
  );
}
