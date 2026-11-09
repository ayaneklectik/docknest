import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffSession } from "@backend/admin-session";
import { listAuditLogs } from "@backend/audit";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log", robots: { index: false, follow: false } };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!await getStaffSession("audit.view")) redirect("/admin");
  const query = (await searchParams).q?.slice(0, 100) ?? "";
  const entries = listAuditLogs(query);
  return <div className="page-shell admin-shell">
    <section className="admin-heading"><div><p className="eyebrow">GOVERNANCE · AUDIT</p><h1>Changes with<br /><em>accountability.</em></h1></div><p>Administrative state changes are recorded with their actor, target, and structured details.</p></section>
    <section className="admin-content">
      <div className="admin-section-heading"><div className="section-kicker">Audit events</div><h2>Recent activity <span>{entries.length}</span></h2></div>
      <form className="customer-search" action="/admin/audit" method="get"><label htmlFor="audit-search">Search action, entity, ID, or staff email</label><div><input id="audit-search" name="q" defaultValue={query} maxLength={100} /><button className="small-action" type="submit">Search</button></div></form>
      {entries.length === 0 ? <p className="empty-state">No audit entries match this search.</p> : <div className="table-scroll"><table className="admin-table">
        <thead><tr><th>Time / actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>{entries.map((entry) => <tr key={entry.id}>
          <td>{new Date(entry.created_at).toLocaleString()}<span className="table-detail">{entry.actor_name ?? "System"}{entry.actor_email ? ` · ${entry.actor_email}` : ""}</span></td>
          <td><strong>{entry.action}</strong></td>
          <td>{entry.entity_type}<span className="table-detail">{entry.entity_id}</span></td>
          <td><code className="audit-details">{entry.details_json}</code></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
