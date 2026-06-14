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
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { employees, departments, leaves, attendance, positions } = useDataStore();

  if (user?.role === "employee") return <EmployeeDashboard />;
  if (user?.role === "manager") return <ManagerDashboard />;

  const active = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter((e) => e.status === "on-leave").length;
  const today = attendance.length ? attendance.slice().sort((a, b) => b.date.localeCompare(a.date))[0].date : "";
  const todayPresent = attendance.filter((a) => a.date === today && a.status === "present").length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const totalSalary = employees.reduce((s, e) => s + e.salary, 0);
  const last30Present = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = Math.round(
    (last30Present / Math.max(1, attendance.length)) * 100,
  );

  // Department distribution
  const deptData = departments.map((d) => ({
    name: d.name,
    value: employees.filter((e) => e.department === d.name).length,
  }));

  // Attendance trend (last 7 working days)
  const byDate = new Map<string, { date: string; present: number; late: number; absent: number }>();
  for (const r of attendance) {
    if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date, present: 0, late: 0, absent: 0 });
    byDate.get(r.date)![r.status === "on-leave" ? "absent" : r.status]++;
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
    if (e.salary < 60000) buckets[0].value++;
    else if (e.salary < 90000) buckets[1].value++;
    else if (e.salary < 120000) buckets[2].value++;
    else buckets[3].value++;
  }

  const pieColors = [
    "oklch(0.65 0.2 275)",
    "oklch(0.72 0.17 162)",
    "oklch(0.78 0.16 75)",
    "oklch(0.7 0.2 330)",
    "oklch(0.65 0.22 27)",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.username ?? "Admin"}`}
        description="Here's what's happening across your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={employees.length} delta="+3 this month" icon={Users} tone="primary" />
        <StatCard label="Active" value={active} delta={`${Math.round((active / employees.length) * 100)}% of workforce`} icon={UserCheck} tone="accent" />
        <StatCard label="Departments" value={departments.length} icon={Building2} tone="warning" />
        <StatCard label="Positions" value={positions.length} icon={Briefcase} tone="primary" />
        <StatCard label="On Leave" value={onLeaveCount} icon={PalmtreeIcon} tone="warning" />
        <StatCard label="Today's Attendance" value={todayPresent} delta={today} icon={ClockArrowUp} tone="accent" />
        <StatCard label="Pending Leaves" value={pendingLeaves} icon={CalendarClock} tone="destructive" />
        <StatCard label="Monthly Payroll" value={`$${(totalSalary / 12 / 1000).toFixed(1)}k`} delta="across all teams" icon={Wallet} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Attendance trend</h3>
              <p className="text-xs text-muted-foreground">Last 7 working days</p>
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
            {leaves.slice(0, 5).map((l) => {
              const emp = employees.find((e) => e.id === l.employeeId);
              return (
                <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{emp?.fullName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{l.type} · {l.startDate}</div>
                  </div>
                  <Badge
                    variant={
                      l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"
                    }
                    className="capitalize text-[10px]"
                  >
                    {l.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const { employees, attendance, leaves, announcements } = useDataStore();
  const me = employees.find((e) => e.email === user?.email) ?? employees[0];
  const myAtt = attendance.filter((a) => a.employeeId === me.id);
  const presentDays = myAtt.filter((a) => a.status === "present").length;
  const rate = Math.round((presentDays / Math.max(1, myAtt.length)) * 100);
  const myLeaves = leaves.filter((l) => l.employeeId === me.id);

  return (
    <div className="space-y-6">
      <PageHeader title={`Hi, ${me.fullName.split(" ")[0]}`} description="Your personal HR overview." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${rate}%`} delta={`${presentDays}/${myAtt.length} days`} icon={CalendarClock} tone="primary" />
        <StatCard label="Leave Balance" value={`${20 - myLeaves.filter((l) => l.status === "approved").length} d`} icon={Users} tone="accent" />
        <StatCard label="Monthly Salary" value={`$${(me.salary / 12).toFixed(0)}`} icon={Wallet} tone="warning" />
        <StatCard label="Position" value={me.position} icon={Building2} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3">Latest announcements</h3>
          <div className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="border-l-2 border-primary/60 pl-3 py-1">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{a.body}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3">Your recent activity</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
              <div>
                <div>Checked in at 08:58</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
              <div>
                <div>Leave request {myLeaves[0]?.status ?? "pending"}</div>
                <div className="text-xs text-muted-foreground">2 days ago</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-muted-foreground" />
              <div>
                <div>Profile viewed by HR</div>
                <div className="text-xs text-muted-foreground">Last week</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { employees, attendance, leaves } = useDataStore();
  const me = employees.find((e) => e.email === user?.email);
  const myDept = me?.department;
  const team = employees.filter((e) => e.department === myDept && e.id !== me?.id);
  const teamIds = new Set(team.map((t) => t.id));
  const today = attendance.length ? attendance.slice().sort((a, b) => b.date.localeCompare(a.date))[0].date : "";
  const todayPresent = attendance.filter((a) => a.date === today && teamIds.has(a.employeeId) && a.status === "present").length;
  const pendingTeamLeaves = leaves.filter((l) => l.status === "pending" && teamIds.has(l.employeeId)).length;
  const teamAttendance = attendance.filter((a) => teamIds.has(a.employeeId));
  const rate = Math.round((teamAttendance.filter((a) => a.status === "present").length / Math.max(1, teamAttendance.length)) * 100);

  const byDate = new Map<string, { date: string; present: number; absent: number }>();
  for (const r of teamAttendance) {
    if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date, present: 0, absent: 0 });
    if (r.status === "present") byDate.get(r.date)!.present++;
    if (r.status === "absent" || r.status === "on-leave") byDate.get(r.date)!.absent++;
  }
  const trend = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${me?.fullName?.split(" ")[0] ?? "Manager"}`} description={`Managing ${myDept ?? "your team"}.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team Members" value={team.length} icon={Users} tone="primary" />
        <StatCard label="Present Today" value={todayPresent} delta={today} icon={UserCheck} tone="accent" />
        <StatCard label="Pending Leaves" value={pendingTeamLeaves} icon={CalendarClock} tone="warning" />
        <StatCard label="Attendance Rate" value={`${rate}%`} icon={TrendingUp} tone="primary" />
      </div>
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold mb-1">Team attendance trend</h3>
        <p className="text-xs text-muted-foreground mb-4">Last 7 working days</p>
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