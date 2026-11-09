import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminProjects } from "@/components/admin-projects";
import { getStaffSession } from "@backend/admin-session";
import { listProjects } from "@backend/operations";
import { listCustomers } from "@backend/sales";
import { listAssignableStaff } from "@backend/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Development projects", robots: { index: false, follow: false } };

export default async function ProjectsPage() {
  if (!await getStaffSession("projects.manage")) redirect("/admin");
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">DELIVERY · DEVELOPMENT PROJECTS</p><h1>Make the work<br /><em>visible.</em></h1></div><p>Track customer projects through inquiry, payment, delivery, review, and completion.</p></section>
    <section className="admin-content"><div className="admin-section-heading"><div className="section-kicker">Project operations</div><h2>Project list</h2></div><AdminProjects projects={listProjects()} customers={listCustomers()} staff={listAssignableStaff()} /></section>
  </div>;
}
