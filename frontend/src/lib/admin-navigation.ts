import type { StaffPermission } from "@/lib/staff-types";

export type AdminNavigationItem = {
  href: string;
  label: string;
  code: string;
  permission: StaffPermission | "administrator" | null;
};

export const adminNavigationGroups: Array<{
  label: string;
  items: AdminNavigationItem[];
}> = [
  {
    label: "Workspace",
    items: [
      { href: "/admin", label: "Overview", code: "00", permission: null },
      { href: "/admin/site", label: "Website control", code: "01", permission: "content.manage" },
      { href: "/admin/products", label: "Products & pricing", code: "02", permission: "catalog.manage" },
      { href: "/admin/content", label: "Content", code: "03", permission: "content.manage" }
    ]
  },
  {
    label: "Business",
    items: [
      { href: "/admin/quotes", label: "Quotations", code: "04", permission: "quotes.manage" },
      { href: "/admin/orders", label: "Orders", code: "05", permission: "orders.manage" },
      { href: "/admin/payments", label: "Payments", code: "06", permission: "payments.review" },
      { href: "/admin/invoices", label: "Invoices", code: "07", permission: "invoices.manage" },
      { href: "/admin/customers", label: "Customers", code: "08", permission: "customers.manage" },
      { href: "/admin/projects", label: "Projects", code: "09", permission: "projects.manage" }
    ]
  },
  {
    label: "Support & operations",
    items: [
      { href: "/admin/tickets", label: "Support tickets", code: "10", permission: "support.manage" },
      { href: "/admin/domains", label: "Domain requests", code: "11", permission: "domains.manage" },
      { href: "/admin/email", label: "Email outbox", code: "12", permission: "email.manage" }
    ]
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/users", label: "User accounts", code: "13", permission: "administrator" },
      { href: "/admin/analytics", label: "Analytics", code: "14", permission: "analytics.view" },
      { href: "/admin/audit", label: "Audit log", code: "15", permission: "audit.view" }
    ]
  }
];
