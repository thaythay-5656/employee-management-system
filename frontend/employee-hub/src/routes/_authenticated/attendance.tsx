import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/cards/stat-card";
import { CalendarCheck, CalendarX, Clock, Download, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel, exportTableToPDF } from "@/lib/export";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

import { useAttendance, useCreateAttendance, useUpdateAttendance } from "@/api/queries/useAttendace";
import { useEmployees } from "@/api/queries/useEmployees";
import { useDepartments } from "@/api/queries/useDepartments";
import type { Employee } from "@/types/api";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
});

function employeeName(e: Employee | undefined) {
  if (!e) return "—";
  const full = `${e.user.first_name} ${e.user.last_name}`.trim();
  return full || e.user.username;
}

function AttendancePage() {
  const user = useAuthStore((s) => s.user);
  const isEmployee = user?.role === "employee";
  const isManager = user?.role === "manager";

  // /api/attendance/ already scopes by role server-side:
  // admin/manager -> all (manager sees their team), employee -> self only.
  const { data: attendance = [], isLoading } = useAttendance();
  const { data: employees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();

  const createAttendance = useCreateAttendance();

  const [dateFilter, setDateFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const filtered = attendance.filter((a) => {
    if (dateFilter && a.attendance_date !== dateFilter) return false;
    if (empFilter !== "all" && a.employee !== Number(empFilter)) return false;
    if (deptFilter !== "all") {
      const emp = employeeMap.get(a.employee);
      if (emp?.department !== Number(deptFilter)) return false;
    }
    return true;
  });

  const present = filtered.filter((a) => a.status === "present").length;
  const late = filtered.filter((a) => a.status === "late").length;
  const absent = filtered.filter((a) => a.status === "absent" || a.status === "on_leave").length;

  const recent = [...filtered].sort((a, b) => b.attendance_date.localeCompare(a.attendance_date)).slice(0, 20);

  const onExportExcel = () => {
    exportToExcel(
      filtered.map((a) => ({
        Date: a.attendance_date,
        Employee: employeeName(employeeMap.get(a.employee)),
        "Check In": a.check_in ?? "—",
        "Check Out": a.check_out ?? "—",
        Status: a.status,
      })),
      "attendance",
    );
  };
  const onExportPDF = () => {
    exportTableToPDF(
      "Attendance Report",
      ["Date", "Employee", "Check In", "Check Out", "Status"],
      filtered.map((a) => [
        a.attendance_date,
        employeeName(employeeMap.get(a.employee)),
        a.check_in ?? "—",
        a.check_out ?? "—",
        a.status,
      ]),
      "attendance",
    );
  };

  // Self clock in/out (employee role only)
  const me = employees[0]; // /api/employee/ returns only self for role=employee
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayRec = me ? attendance.find((a) => a.employee === me.id && a.attendance_date === todayStr) : undefined;

  const updateTodayRec = useUpdateAttendance(todayRec?.id ?? 0);

  const clockIn = () => {
    if (!me) return;
    const time = now.toTimeString().slice(0, 8); // HH:MM:SS

    if (todayRec) {
      toast.error("You've already checked in today");
      return;
    }

    createAttendance.mutate(
      {
        employee: me.id,
        attendance_date: todayStr,
        check_in: time,
        check_out: null,
        status: "present",
      },
      {
        onSuccess: () => toast.success(`Checked in at ${now.toLocaleTimeString()}`),
        onError: () => toast.error("Failed to check in"),
      }
    );
  };

  const clockOut = () => {
    if (!todayRec) {
      toast.error("You haven't checked in today");
      return;
    }
    if (todayRec.check_out) {
      toast.error("You've already checked out today");
      return;
    }

    const time = now.toTimeString().slice(0, 8);

    updateTodayRec.mutate(
      { check_out: time },
      {
        onSuccess: () => toast.success(`Checked out at ${now.toLocaleTimeString()}`),
        onError: () => toast.error("Failed to check out"),
      }
    );
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading attendance…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My attendance" : "Attendance"}
        description={isEmployee ? "Your recent check-ins and work hours." : isManager ? "Your team's attendance." : "Organization-wide attendance log."}
        actions={
          <div className="flex gap-2">
            {isEmployee && (
              <>
                <Button size="sm" variant="outline" onClick={clockIn} disabled={!!todayRec?.check_in}>
                  <LogIn className="h-3.5 w-3.5 mr-1" /> Clock in
                </Button>
                <Button size="sm" variant="outline" onClick={clockOut} disabled={!todayRec || !!todayRec.check_out}>
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Clock out
                </Button>
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
              {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{employeeName(e)}</SelectItem>)}
            </SelectContent>
          </Select>
          {!isManager && (
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="sm:w-48"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.department_name}</SelectItem>)}
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
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{r.attendance_date}</td>
                  {!isEmployee && <td className="px-4 py-3 text-muted-foreground">{employeeName(employeeMap.get(r.employee))}</td>}
                  <td className="px-4 py-3 text-muted-foreground">{r.check_in ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.check_out ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        r.status === "present" ? "default" : r.status === "late" ? "secondary" : "destructive"
                      }
                      className="capitalize"
                    >
                      {r.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={isEmployee ? 4 : 5} className="text-center py-12 text-muted-foreground">No attendance records.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
