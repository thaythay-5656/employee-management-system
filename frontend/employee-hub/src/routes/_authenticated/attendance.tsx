import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/cards/stat-card";
import { CalendarCheck, CalendarX, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const user = useAuthStore((s) => s.user);
  const { attendance, employees } = useDataStore();

  const isEmployee = user?.role === "employee";
  const filtered = isEmployee
    ? attendance.filter((a) => a.employeeId === (user?.employeeId ?? employees[0].id))
    : attendance;

  const present = filtered.filter((a) => a.status === "present").length;
  const late = filtered.filter((a) => a.status === "late").length;
  const absent = filtered.filter((a) => a.status === "absent").length;

  const recent = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My attendance" : "Attendance"}
        description={isEmployee ? "Your recent check-ins and work hours." : "Organization-wide attendance log."}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Present" value={present} icon={CalendarCheck} tone="accent" />
        <StatCard label="Late" value={late} icon={Clock} tone="warning" />
        <StatCard label="Absent" value={absent} icon={CalendarX} tone="destructive" />
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                {!isEmployee && <th className="text-left px-4 py-3 font-medium">Employee</th>}
                <th className="text-left px-4 py-3 font-medium">Check-in</th>
                <th className="text-left px-4 py-3 font-medium">Check-out</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{r.date}</td>
                    {!isEmployee && <td className="px-4 py-3 text-muted-foreground">{emp?.fullName}</td>}
                    <td className="px-4 py-3 text-muted-foreground">{r.checkIn ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.checkOut ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          r.status === "present" ? "default" : r.status === "late" ? "secondary" : "destructive"
                        }
                        className="capitalize"
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}