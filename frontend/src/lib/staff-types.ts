export const staffPermissions = [
  "catalog.manage",
  "quotes.manage",
  "orders.manage",
  "payments.review",
  "invoices.manage",
  "customers.manage",
  "projects.manage",
  "support.manage",
  "domains.manage",
  "content.manage",
  "email.manage",
  "analytics.view",
  "audit.view"
] as const;
export type StaffPermission = (typeof staffPermissions)[number];

export type StaffRole = {
  id: string;
  name: string;
  description: string;
  permissions: StaffPermission[];
};
export type StaffUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};
