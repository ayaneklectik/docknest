"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { projectStatuses, type ProjectRecord } from "@/lib/operations-types";
import type { CustomerRecord } from "@backend/sales";
import type { StaffUser } from "@backend/staff";

export function AdminProjects({ projects, customers, staff }: {
  projects: ProjectRecord[];
  customers: CustomerRecord[];
  staff: StaffUser[];
}) {
  const [notice, setNotice] = useState("");
  const router = useRouter();

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.get("customerId"),
          title: form.get("title"),
          description: form.get("description"),
          dueAt: form.get("dueAt") || null
        })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(result.error ?? "Project could not be created.");
        return;
      }
      formElement.reset();
      setNotice("Project created.");
      router.refresh();
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>, project: ProjectRecord) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.get("status"),
          dueAt: form.get("dueAt") || null,
          assignedTo: form.get("assignedTo") || null
        })
      });
      const result = await response.json() as { error?: string };
      setNotice(response.ok ? `Saved ${project.title}.` : result.error ?? "Project could not be updated.");
      if (response.ok) router.refresh();
    } catch {
      setNotice("The server could not be reached. Please try again.");
    }
  }

  return (
    <>
      <p className="form-message" aria-live="polite" role="status">{notice}</p>
      <form className="project-create-form" onSubmit={create}>
        <h3>Create a development project</h3>
        <label>Customer<select name="customerId" required defaultValue=""><option value="" disabled>Select a customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>)}</select></label>
        <label>Project title<input name="title" minLength={3} maxLength={160} required /></label>
        <label>Description<textarea name="description" rows={3} maxLength={4000} /></label>
        <label>Target date<input name="dueAt" type="date" /></label>
        <button className="small-action" type="submit" disabled={customers.length === 0}>Create project</button>
        {customers.length === 0 && <span className="muted-copy">Create a customer by receiving a quote or support request before opening a project.</span>}
        {staff.length === 0 && <span className="muted-copy">No assignable staff accounts are set up yet.</span>}
      </form>
      {projects.length === 0 ? <p className="empty-state">No development projects yet.</p> : (
        <div className="project-list">{projects.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-card-heading"><div><span className="section-kicker">{project.customer_name} · {project.customer_email}</span><h3>{project.title}</h3></div><span className={`status-pill status-${project.status}`}>{project.status.replaceAll("_", " ")}</span></div>
            {project.description && <p>{project.description}</p>}
            <form onSubmit={(event) => void save(event, project)}>
              <label>Status<select name="status" defaultValue={project.status}>{projectStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
              <label>Target date<input name="dueAt" type="date" defaultValue={project.due_at?.slice(0, 10) ?? ""} /></label>
              <label>Assignee<select name="assignedTo" defaultValue={project.assigned_to ?? ""}><option value="">Unassigned</option>{staff.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label>
              <button className="small-action" type="submit">Save project</button>
            </form>
            <span className="table-detail">Updated {new Date(project.updated_at).toLocaleString()}</span>
          </article>
        ))}</div>
      )}
    </>
  );
}
