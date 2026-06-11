import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/cards/stat-card";
import { CalendarCheck, CalendarX, Clock, Download, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { exportToExcel, exportTableToPDF } from "@/lib/export";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const user = useAuthStore((s) => s.user);
  const { attendance, employees } = useDataStore();

  const isEmployee = user?.role === "employee";
  const isManager = user?.role === "manager";
  const me = employees.find((e) => e.id === user?.employeeId);
  const myId = user?.employeeId ?? employees[0].id;

  const [dateFilter, setDateFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  let scoped = attendance;
  if (isEmployee) scoped = attendance.filter((a) => a.employeeId === myId);
  else if (isManager && me) {
    const teamIds = new Set(employees.filter((e) => e.department === me.department).map((e) => e.id));
    scoped = attendance.filter((a) => teamIds.has(a.employeeId));
  }

  const filtered = scoped.filter((a) => {
    if (dateFilter && a.date !== dateFilter) return false;
    if (empFilter !== "all" && a.employeeId !== empFilter) return false;
    if (deptFilter !== "all") {
      const emp = employees.find((e) => e.id === a.employeeId);
      if (emp?.department !== deptFilter) return false;
    }
    return true;
  });

  const present = filtered.filter((a) => a.status === "present").length;
  const late = filtered.filter((a) => a.status === "late").length;
  const absent = filtered.filter((a) => a.status === "absent").length;

  const recent = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  const onExportExcel = () => {
    exportToExcel(
      filtered.map((a) => {
        const e = employees.find((x) => x.id === a.employeeId);
        return { Date: a.date, Employee: e?.fullName ?? "—", "Check In": a.checkIn ?? "—", "Check Out": a.checkOut ?? "—", Status: a.status };
      }),
      "attendance",
    );
  };
  const onExportPDF = () => {
    exportTableToPDF(
      "Attendance Report",
      ["Date", "Employee", "Check In", "Check Out", "Status"],
      filtered.map((a) => {
        const e = employees.find((x) => x.id === a.employeeId);
        return [a.date, e?.fullName ?? "—", a.checkIn ?? "—", a.checkOut ?? "—", a.status];
      }),
      "attendance",
    );
  };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayRec = scoped.find((a) => a.employeeId === myId && a.date === todayStr);
  const clockIn = () => toast.success(`Checked in at ${now.toLocaleTimeString()}`);
  const clockOut = () => toast.success(`Checked out at ${now.toLocaleTimeString()}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My attendance" : "Attendance"}
        description={isEmployee ? "Your recent check-ins and work hours." : isManager ? "Your team's attendance." : "Organization-wide attendance log."}
        actions={
          <div className="flex gap-2">
            {isEmployee && (
              <>
                <Button size="sm" variant="outline" onClick={clockIn} disabled={!!todayRec?.checkIn}><LogIn className="h-3.5 w-3.5 mr-1" /> Clock in</Button>
                <Button size="sm" variant="outline" onClick={clockOut}><LogOut className="h-3.5 w-3.5 mr-1" /> Clock out</Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={onExportExcel}><Download className="h-3.5 w-3.5 mr-1" /> Excel</Button>
            <Button size="sm" variant="outline" onClick={onExportPDF}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
          </div>
        }
      />
      {!isEmployee && (
        <div className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="sm:w-48" />
          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Employee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
          {!isManager && (
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="sm:w-48"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {[...new Set(employees.map((e) => e.department))].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="ghost" onClick={() => { setDateFilter(""); setEmpFilter("all"); setDeptFilter("all"); }}>Clear</Button>
        </div>
      )}
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