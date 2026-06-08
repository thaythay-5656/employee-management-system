import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { useDataStore } from "@/store/data-store";

export const Route = createFileRoute("/_authenticated/audit-log")({
  component: AuditLogPage,
});

function AuditLogPage() {
  const logs = useDataStore((s) => s.auditLogs);
  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="System-wide actions and changes." />
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium">When</th>
                <th className="text-left px-4 py-3 font-medium">Actor</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{l.actor}</td>
                  <td className="px-4 py-3">{l.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.target ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No activity logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}