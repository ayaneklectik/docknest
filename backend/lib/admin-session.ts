import { headers } from "next/headers";
import { auth } from "@backend/auth";
import type { StaffPermission } from "@/lib/staff-types";

export async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function getStaffSession(_permission: StaffPermission) {
  void _permission;
  return getAdminSession();
}

export async function getSignedInStaffSession() {
  return getAdminSession();
}
