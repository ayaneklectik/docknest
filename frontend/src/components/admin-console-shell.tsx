"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AdminNavigationItem } from "@/lib/admin-navigation";

type AdminNavigationGroup = {
  label: string;
  items: AdminNavigationItem[];
};

export function AdminConsoleShell({
  children,
  brandName,
  userName,
  groups
}: Readonly<{
  children: React.ReactNode;
  brandName: string;
  userName: string;
  groups: AdminNavigationGroup[];
}>) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return children;

  const navigation = groups.map((group) => (
    <div className="admin-sidebar-group" key={group.label}>
      <span className="admin-sidebar-label">{group.label}</span>
      {group.items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`admin-sidebar-link${active ? " is-active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <span className="admin-sidebar-code">{item.code}</span>
            <span>{item.label}</span>
            {active && <span className="admin-sidebar-indicator" aria-hidden="true">↗</span>}
          </Link>
        );
      })}
    </div>
  ));

  return (
    <div className="admin-console">
      <aside className="admin-sidebar">
        <Link className="admin-console-brand" href="/admin" aria-label={`${brandName} control center`}>
          <span className="admin-console-mark">d.</span>
          <span>{brandName}<small>CONTROL CENTER</small></span>
        </Link>
        <nav className="admin-sidebar-navigation" aria-label="Administrator navigation">
          {navigation}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-sidebar-user"><i>{userName.slice(0, 1).toUpperCase()}</i><span><b>{userName}</b><small>Administrator</small></span></span>
          <div className="admin-sidebar-actions">
            <ThemeToggle />
            <AdminLogoutButton />
          </div>
        </div>
      </aside>
      <main className="admin-workspace">{children}</main>
      <details className="admin-mobile-navigation">
        <summary><span>Admin navigation</span><b aria-hidden="true">☰</b></summary>
        <nav aria-label="Mobile administrator navigation">{navigation}</nav>
        <div className="admin-mobile-actions"><ThemeToggle /><AdminLogoutButton /></div>
      </details>
    </div>
  );
}
