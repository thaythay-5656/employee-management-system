import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, Building2, Wallet, TrendingUp, CalendarClock, Briefcase, PalmtreeIcon, ClockArrowUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/cards/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";

import { useEmployees } from "@/api/queries/useEmployees";
import { useDepartments } from "@/api/queries/useDepartments";
import { usePositions } from "@/api/queries/usePositions";
import { useLeaves } from "@/api/queries/useLeaves";
import { useAttendance } from "@/api/queries/useAttendace";
import { useAnnouncements } from "@/api/queries/useAnnouncements";
import type { Employee, Department, Position } from "@/types/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

// =========================
// HELPERS
// =========================

function employeeName(e: Employee | undefined) {
  if (!e) return "—";
  const full = `${e.user.first_name} ${e.user.last_name}`.trim();
  return full || e.user.username;
}

function departmentName(departments: Department[], id: number) {
  return departments.find((d) => d.id === id)?.department_name ?? "—";
}

function positionName(positions: Position[], id: number) {
  return positions.find((p) => p.id === id)?.position_name ?? "—";
}

// =========================
// ROOT
// =========================

function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === "employee") return <EmployeeDashboard />;
  if (user?.role === "manager") return <ManagerDashboard />;
  return <AdminDashboard />;
}

// =========================
// ADMIN DASHBOARD
// =========================

function AdminDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { data: leaves = [] } = useLeaves();
  const { data: attendance = [] } = useAttendance();

  if (loadingEmployees) {
    return <div className="text-sm text-muted-foreground">Loading dashboard…</div>;
  }

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const onLeaveCount = leaves.filter(
    (l) => l.status === "approved" && new Date(l.end_date) >= new Date()
  ).length;

  const totalSalary = employees.reduce((s, e) => s + Number(e.salary || 0), 0);

  // Today's attendance
  const dates = attendance.map((a) => a.attendance_date).sort();
  const today = dates.length ? dates[dates.length - 1] : "";
  const todayPresent = attendance.filter(
    (a) => a.attendance_date === today && a.status === "present"
  ).length;

  const last30Present = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = Math.round((last30Present / Math.max(1, attendance.length)) * 100);

  // Department distribution
  const deptData = departments.map((d) => ({
    name: d.department_name,
    value: employees.filter((e) => e.department === d.id).length,
  }));

  // Attendance trend (last 7 days with records)
  const byDate = new Map<string, { date: string; present: number; late: number; absent: number }>();
  for (const r of attendance) {
    if (!byDate.has(r.attendance_date)) {
      byDate.set(r.attendance_date, { date: r.attendance_date, present: 0, late: 0, absent: 0 });
    }
    const bucket = byDate.get(r.attendance_date)!;
    if (r.status === "present") bucket.present++;
    else if (r.status === "late") bucket.late++;
    else bucket.absent++; // absent or on_leave
  }
  const trend = Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  // Salary distribution buckets
  const buckets = [
    { name: "<60k", value: 0 },
    { name: "60-90k", value: 0 },
    { name: "90-120k", value: 0 },
    { name: ">120k", value: 0 },
  ];
  for (const e of employees) {
    const salary = Number(e.salary || 0);
    if (salary < 60000) buckets[0].value++;
    else if (salary < 90000) buckets[1].value++;
    else if (salary < 120000) buckets[2].value++;
    else buckets[3].value++;
  }

  const pieColors = [
    "oklch(0.65 0.2 275)",
    "oklch(0.72 0.17 162)",
    "oklch(0.78 0.16 75)",
    "oklch(0.7 0.2 330)",
    "oklch(0.65 0.22 27)",
  ];

  // Recent leave requests, joined with employee names
  const recentLeaves = leaves.slice(0, 5).map((l) => ({
    ...l,
    employeeLabel: employeeName(employees.find((e) => e.id === l.employee)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.username ?? "Admin"}`}
        description="Here's what's happening across your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={employees.length} icon={Users} tone="primary" />
        <StatCard label="Departments" value={departments.length} icon={Building2} tone="warning" />
        <StatCard label="Positions" value={positions.length} icon={Briefcase} tone="primary" />
        <StatCard label="On Leave" value={onLeaveCount} icon={PalmtreeIcon} tone="warning" />
        <StatCard label="Today's Attendance" value={todayPresent} delta={today} icon={ClockArrowUp} tone="accent" />
        <StatCard label="Pending Leaves" value={pendingLeaves} icon={CalendarClock} tone="destructive" />
        <StatCard
          label="Monthly Payroll"
          value={`$${(totalSalary / 12 / 1000).toFixed(1)}k`}
          delta="across all teams"
          icon={Wallet}
          tone="primary"
        />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={UserCheck} tone="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Attendance trend</h3>
              <p className="text-xs text-muted-foreground">Last recorded days</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" /> {attendanceRate}% present
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="var(--primary)" strokeWidth={2} />
              <Line type="monotone" dataKey="late" stroke="var(--warning)" strokeWidth={2} />
              <Line type="monotone" dataKey="absent" stroke="var(--destructive)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-1">By department</h3>
          <p className="text-xs text-muted-foreground mb-4">Headcount distribution</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={deptData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {deptData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {deptData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                <span className="truncate text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <h3 className="font-semibold mb-1">Salary distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Number of employees per salary band</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3">Recent leave requests</h3>
          <div className="space-y-3">
            {recentLeaves.length === 0 && (
              <div className="text-xs text-muted-foreground">No leave requests yet.</div>
            )}
            {recentLeaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.employeeLabel}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {l.leave_type} · {l.start_date}
                  </div>
                </div>
                <Badge
                  variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}
                  className="capitalize text-[10px]"
                >
                  {l.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================
// EMPLOYEE DASHBOARD
// =========================

function EmployeeDashboard() {
  const { data: employees = [] } = useEmployees();
  const { data: positions = [] } = usePositions();
  const { data: attendance = [] } = useAttendance();
  const { data: leaves = [] } = useLeaves();
  const { data: announcements = [] } = useAnnouncements();

  // Employee endpoint already scopes to "self" for role=employee,
  // so employees[0] is the logged-in user's own record.
  const me = employees[0];

  if (!me) {
    return <div className="text-sm text-muted-foreground">Loading your dashboard…</div>;
  }

  const myAttendance = attendance.filter((a) => a.employee === me.id);
  const presentDays = myAttendance.filter((a) => a.status === "present").length;
  const rate = Math.round((presentDays / Math.max(1, myAttendance.length)) * 100);

  const myLeaves = leaves.filter((l) => l.employee === me.id);
  const approvedDaysUsed = myLeaves
    .filter((l) => l.status === "approved")
    .reduce((sum, l) => {
      const days = (new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000 + 1;
      return sum + Math.max(0, Math.round(days));
    }, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Hi, ${employeeName(me).split(" ")[0]}`} description="Your personal HR overview." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${rate}%`} delta={`${presentDays}/${myAttendance.length} days`} icon={CalendarClock} tone="primary" />
        <StatCard label="Leave Used" value={`${approvedDaysUsed} d`} icon={Users} tone="accent" />
        <StatCard label="Monthly Salary" value={`$${(Number(me.salary || 0) / 12).toFixed(0)}`} icon={Wallet} tone="warning" />
        <StatCard label="Position" value={positionName(positions, me.position)} icon={Building2} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3">Latest announcements</h3>
          <div className="space-y-3">
            {announcements.length === 0 && (
              <div className="text-xs text-muted-foreground">No announcements yet.</div>
            )}
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="border-l-2 border-primary/60 pl-3 py-1">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{a.content}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3">Your recent leave requests</h3>
          <div className="space-y-3">
            {myLeaves.length === 0 && (
              <div className="text-xs text-muted-foreground">No leave requests yet.</div>
            )}
            {myLeaves.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium capitalize truncate">{l.leave_type}</div>
                  <div className="text-xs text-muted-foreground">{l.start_date} → {l.end_date}</div>
                </div>
                <Badge
                  variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}
                  className="capitalize text-[10px]"
                >
                  {l.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================
// MANAGER DASHBOARD
// =========================

function ManagerDashboard() {
  const { data: employees = [] } = useEmployees();
  const { data: attendance = [] } = useAttendance();
  const { data: leaves = [] } = useLeaves();

  // For role=manager, EmployeeViewSet.get_queryset() returns
  // Employee.objects.filter(role='employee') — i.e. the manager's team.
  const team = employees;
  const teamIds = new Set(team.map((t) => t.id));

  const dates = attendance.map((a) => a.attendance_date).sort();
  const today = dates.length ? dates[dates.length - 1] : "";
  const todayPresent = attendance.filter(
    (a) => a.attendance_date === today && teamIds.has(a.employee) && a.status === "present"
  ).length;

  const pendingTeamLeaves = leaves.filter((l) => l.status === "pending" && teamIds.has(l.employee)).length;

  const teamAttendance = attendance.filter((a) => teamIds.has(a.employee));
  const rate = Math.round(
    (teamAttendance.filter((a) => a.status === "present").length / Math.max(1, teamAttendance.length)) * 100
  );

  const byDate = new Map<string, { date: string; present: number; absent: number }>();
  for (const r of teamAttendance) {
    if (!byDate.has(r.attendance_date)) {
      byDate.set(r.attendance_date, { date: r.attendance_date, present: 0, absent: 0 });
    }
    const bucket = byDate.get(r.attendance_date)!;
    if (r.status === "present") bucket.present++;
    else bucket.absent++; // absent, late, or on_leave grouped here for simplicity
  }
  const trend = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  return (
    <div className="space-y-6">
      <PageHeader title="Team overview" description="Here's how your team is doing." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team Members" value={team.length} icon={Users} tone="primary" />
        <StatCard label="Present Today" value={todayPresent} delta={today} icon={UserCheck} tone="accent" />
        <StatCard label="Pending Leaves" value={pendingTeamLeaves} icon={CalendarClock} tone="warning" />
        <StatCard label="Attendance Rate" value={`${rate}%`} icon={TrendingUp} tone="primary" />
      </div>
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold mb-1">Team attendance trend</h3>
        <p className="text-xs text-muted-foreground mb-4">Last recorded days</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Legend />
            <Line type="monotone" dataKey="present" stroke="var(--primary)" strokeWidth={2} />
            <Line type="monotone" dataKey="absent" stroke="var(--destructive)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
