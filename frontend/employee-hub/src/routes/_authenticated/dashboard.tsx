// import { createFileRoute } from "@tanstack/react-router";
// import { Users, UserCheck, Building2, Wallet, TrendingUp, CalendarClock, Briefcase, PalmtreeIcon, ClockArrowUp } from "lucide-react";
// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   Legend,
//   Line,
//   LineChart,
//   Pie,
//   PieChart,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";
// import { StatCard } from "@/components/cards/stat-card";
// import { PageHeader } from "@/components/layout/page-header";
// import { useDataStore } from "@/store/data-store";
// import { useAuthStore } from "@/store/auth-store";
// import { Badge } from "@/components/ui/badge";

// export const Route = createFileRoute("/_authenticated/dashboard")({
//   component: DashboardPage,
// });

// function DashboardPage() {
//   const user = useAuthStore((s) => s.user);
//   const { employees, departments, leaves, attendance, positions } = useDataStore();

//   if (user?.role === "employee") return <EmployeeDashboard />;
//   if (user?.role === "manager") return <ManagerDashboard />;

//   const active = employees.filter((e) => e.status === "active").length;
//   const onLeaveCount = employees.filter((e) => e.status === "on-leave").length;
//   const today = attendance.length ? attendance.slice().sort((a, b) => b.date.localeCompare(a.date))[0].date : "";
//   const todayPresent = attendance.filter((a) => a.date === today && a.status === "present").length;
//   const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
//   const totalSalary = employees.reduce((s, e) => s + e.salary, 0);
//   const last30Present = attendance.filter((a) => a.status === "present").length;
//   const attendanceRate = Math.round(
//     (last30Present / Math.max(1, attendance.length)) * 100,
//   );

//   // Department distribution
//   const deptData = departments.map((d) => ({
//     name: d.name,
//     value: employees.filter((e) => e.department === d.name).length,
//   }));

//   // Attendance trend (last 7 working days)
//   const byDate = new Map<string, { date: string; present: number; late: number; absent: number }>();
//   for (const r of attendance) {
//     if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date, present: 0, late: 0, absent: 0 });
//     byDate.get(r.date)![r.status === "on-leave" ? "absent" : r.status]++;
//   }
//   const trend = Array.from(byDate.values())
//     .sort((a, b) => a.date.localeCompare(b.date))
//     .slice(-7);

//   // Salary distribution buckets
//   const buckets = [
//     { name: "<60k", value: 0 },
//     { name: "60-90k", value: 0 },
//     { name: "90-120k", value: 0 },
//     { name: ">120k", value: 0 },
//   ];
//   for (const e of employees) {
//     if (e.salary < 60000) buckets[0].value++;
//     else if (e.salary < 90000) buckets[1].value++;
//     else if (e.salary < 120000) buckets[2].value++;
//     else buckets[3].value++;
//   }

//   const pieColors = [
//     "oklch(0.65 0.2 275)",
//     "oklch(0.72 0.17 162)",
//     "oklch(0.78 0.16 75)",
//     "oklch(0.7 0.2 330)",
//     "oklch(0.65 0.22 27)",
//   ];

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title={`Welcome back, ${user?.role === "admin" ? "Admin" : "HR"}`}
//         description="Here's what's happening across your organization."
//       />

//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <StatCard label="Total Employees" value={employees.length} delta="+3 this month" icon={Users} tone="primary" />
//         <StatCard label="Active" value={active} delta={`${Math.round((active / employees.length) * 100)}% of workforce`} icon={UserCheck} tone="accent" />
//         <StatCard label="Departments" value={departments.length} icon={Building2} tone="warning" />
//         <StatCard label="Positions" value={positions.length} icon={Briefcase} tone="primary" />
//         <StatCard label="On Leave" value={onLeaveCount} icon={PalmtreeIcon} tone="warning" />
//         <StatCard label="Today's Attendance" value={todayPresent} delta={today} icon={ClockArrowUp} tone="accent" />
//         <StatCard label="Pending Leaves" value={pendingLeaves} icon={CalendarClock} tone="destructive" />
//         <StatCard label="Monthly Payroll" value={`$${(totalSalary / 12 / 1000).toFixed(1)}k`} delta="across all teams" icon={Wallet} tone="primary" />
//       </div>

//       <div className="grid gap-4 lg:grid-cols-3">
//         <div className="glass rounded-xl p-5 lg:col-span-2">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h3 className="font-semibold">Attendance trend</h3>
//               <p className="text-xs text-muted-foreground">Last 7 working days</p>
//             </div>
//             <Badge variant="secondary" className="gap-1">
//               <TrendingUp className="h-3 w-3" /> {attendanceRate}% present
//             </Badge>
//           </div>
//           <ResponsiveContainer width="100%" height={240}>
//             <LineChart data={trend}>
//               <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
//               <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
//               <YAxis stroke="var(--muted-foreground)" fontSize={11} />
//               <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
//               <Legend />
//               <Line type="monotone" dataKey="present" stroke="var(--primary)" strokeWidth={2} />
//               <Line type="monotone" dataKey="late" stroke="var(--warning)" strokeWidth={2} />
//               <Line type="monotone" dataKey="absent" stroke="var(--destructive)" strokeWidth={2} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="glass rounded-xl p-5">
//           <h3 className="font-semibold mb-1">By department</h3>
//           <p className="text-xs text-muted-foreground mb-4">Headcount distribution</p>
//           <ResponsiveContainer width="100%" height={240}>
//             <PieChart>
//               <Pie data={deptData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
//                 {deptData.map((_, i) => (
//                   <Cell key={i} fill={pieColors[i % pieColors.length]} />
//                 ))}
//               </Pie>
//               <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="grid grid-cols-2 gap-1 text-[11px]">
//             {deptData.map((d, i) => (
//               <div key={d.name} className="flex items-center gap-1.5">
//                 <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
//                 <span className="truncate text-muted-foreground">{d.name}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="grid gap-4 lg:grid-cols-3">
//         <div className="glass rounded-xl p-5 lg:col-span-2">
//           <h3 className="font-semibold mb-1">Salary distribution</h3>
//           <p className="text-xs text-muted-foreground mb-4">Number of employees per salary band</p>
//           <ResponsiveContainer width="100%" height={220}>
//             <BarChart data={buckets}>
//               <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
//               <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
//               <YAxis stroke="var(--muted-foreground)" fontSize={11} />
//               <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
//               <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="glass rounded-xl p-5">
//           <h3 className="font-semibold mb-3">Recent leave requests</h3>
//           <div className="space-y-3">
//             {leaves.slice(0, 5).map((l) => {
//               const emp = employees.find((e) => e.id === l.employeeId);
//               return (
//                 <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
//                   <div className="min-w-0">
//                     <div className="font-medium truncate">{emp?.fullName ?? "—"}</div>
//                     <div className="text-xs text-muted-foreground capitalize">{l.type} · {l.startDate}</div>
//                   </div>
//                   <Badge
//                     variant={
//                       l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"
//                     }
//                     className="capitalize text-[10px]"
//                   >
//                     {l.status}
//                   </Badge>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function EmployeeDashboard() {
//   const user = useAuthStore((s) => s.user);
//   const { employees, attendance, leaves, announcements } = useDataStore();
//   const me = employees.find((e) => e.id === user?.employeeId) ?? employees[0];
//   const myAtt = attendance.filter((a) => a.employeeId === me.id);
//   const presentDays = myAtt.filter((a) => a.status === "present").length;
//   const rate = Math.round((presentDays / Math.max(1, myAtt.length)) * 100);
//   const myLeaves = leaves.filter((l) => l.employeeId === me.id);

//   return (
//     <div className="space-y-6">
//       <PageHeader title={`Hi, ${me.fullName.split(" ")[0]}`} description="Your personal HR overview." />
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <StatCard label="Attendance" value={`${rate}%`} delta={`${presentDays}/${myAtt.length} days`} icon={CalendarClock} tone="primary" />
//         <StatCard label="Leave Balance" value={`${20 - myLeaves.filter((l) => l.status === "approved").length} d`} icon={Users} tone="accent" />
//         <StatCard label="Monthly Salary" value={`$${(me.salary / 12).toFixed(0)}`} icon={Wallet} tone="warning" />
//         <StatCard label="Position" value={me.position} icon={Building2} tone="primary" />
//       </div>

//       <div className="grid gap-4 lg:grid-cols-2">
//         <div className="glass rounded-xl p-5">
//           <h3 className="font-semibold mb-3">Latest announcements</h3>
//           <div className="space-y-3">
//             {announcements.slice(0, 3).map((a) => (
//               <div key={a.id} className="border-l-2 border-primary/60 pl-3 py-1">
//                 <div className="text-sm font-medium">{a.title}</div>
//                 <div className="text-xs text-muted-foreground line-clamp-2">{a.body}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="glass rounded-xl p-5">
//           <h3 className="font-semibold mb-3">Your recent activity</h3>
//           <ul className="space-y-3 text-sm">
//             <li className="flex items-start gap-3">
//               <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
//               <div>
//                 <div>Checked in at 08:58</div>
//                 <div className="text-xs text-muted-foreground">Today</div>
//               </div>
//             </li>
//             <li className="flex items-start gap-3">
//               <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
//               <div>
//                 <div>Leave request {myLeaves[0]?.status ?? "pending"}</div>
//                 <div className="text-xs text-muted-foreground">2 days ago</div>
//               </div>
//             </li>
//             <li className="flex items-start gap-3">
//               <span className="mt-1 h-2 w-2 rounded-full bg-muted-foreground" />
//               <div>
//                 <div>Profile viewed by HR</div>
//                 <div className="text-xs text-muted-foreground">Last week</div>
//               </div>
//             </li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ManagerDashboard() {
//   const user = useAuthStore((s) => s.user);
//   const { employees, attendance, leaves } = useDataStore();
//   const me = employees.find((e) => e.id === user?.employeeId);
//   const myDept = me?.department;
//   const team = employees.filter((e) => e.department === myDept && e.id !== me?.id);
//   const teamIds = new Set(team.map((t) => t.id));
//   const today = attendance.length ? attendance.slice().sort((a, b) => b.date.localeCompare(a.date))[0].date : "";
//   const todayPresent = attendance.filter((a) => a.date === today && teamIds.has(a.employeeId) && a.status === "present").length;
//   const pendingTeamLeaves = leaves.filter((l) => l.status === "pending" && teamIds.has(l.employeeId)).length;
//   const teamAttendance = attendance.filter((a) => teamIds.has(a.employeeId));
//   const rate = Math.round((teamAttendance.filter((a) => a.status === "present").length / Math.max(1, teamAttendance.length)) * 100);

//   const byDate = new Map<string, { date: string; present: number; absent: number }>();
//   for (const r of teamAttendance) {
//     if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date, present: 0, absent: 0 });
//     if (r.status === "present") byDate.get(r.date)!.present++;
//     if (r.status === "absent" || r.status === "on-leave") byDate.get(r.date)!.absent++;
//   }
//   const trend = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

//   return (
//     <div className="space-y-6">
//       <PageHeader title={`Hello, ${me?.firstName ?? me?.fullName.split(" ")[0] ?? "Manager"}`} description={`Managing ${myDept ?? "your team"}.`} />
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <StatCard label="Team Members" value={team.length} icon={Users} tone="primary" />
//         <StatCard label="Present Today" value={todayPresent} delta={today} icon={UserCheck} tone="accent" />
//         <StatCard label="Pending Leaves" value={pendingTeamLeaves} icon={CalendarClock} tone="warning" />
//         <StatCard label="Attendance Rate" value={`${rate}%`} icon={TrendingUp} tone="primary" />
//       </div>
//       <div className="glass rounded-xl p-5">
//         <h3 className="font-semibold mb-1">Team attendance trend</h3>
//         <p className="text-xs text-muted-foreground mb-4">Last 7 working days</p>
//         <ResponsiveContainer width="100%" height={240}>
//           <LineChart data={trend}>
//             <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
//             <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
//             <YAxis stroke="var(--muted-foreground)" fontSize={11} />
//             <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
//             <Legend />
//             <Line type="monotone" dataKey="present" stroke="var(--primary)" strokeWidth={2} />
//             <Line type="monotone" dataKey="absent" stroke="var(--destructive)" strokeWidth={2} />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }


import { createFileRoute } from "@tanstack/react-router";
import {
  Users, UserCheck, Building2, Wallet, TrendingUp,
  CalendarClock, Briefcase, PalmtreeIcon, ClockArrowUp,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { StatCard } from "@/components/cards/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import {
  useEmployees, useDepartments, usePositions,
  useLeaves, useAttendance, usePayroll,
} from "@/hooks/useEMS";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const PIE_COLORS = [
  "oklch(0.65 0.2 275)", "oklch(0.72 0.17 162)",
  "oklch(0.78 0.16 75)",  "oklch(0.7 0.2 330)",
  "oklch(0.65 0.22 27)",
];

function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: employees }   = useEmployees();
  const { data: departments } = useDepartments();
  const { data: positions }   = usePositions();
  const { data: leaves }      = useLeaves();
  const { data: attendance }  = useAttendance();

  if (user?.role === "employee") return <EmployeeDashboard />;
  if (user?.role === "manager") return <ManagerDashboard />;

  // ── Admin dashboard ──────────────────────────────────────────────────────
  const active = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter((e) => e.status === "inactive").length;

  // Latest attendance date
  const today = attendance.length
    ? attendance.slice().sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))[0].attendance_date
    : "";
  const todayPresent = attendance.filter(
    (a) => a.attendance_date === today && a.status === "present"
  ).length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const totalSalary = employees.reduce((s, e) => s + parseFloat(e.salary), 0);

  const attendanceRate = Math.round(
    (attendance.filter((a) => a.status === "present").length /
      Math.max(1, attendance.length)) * 100
  );

  // Department pie chart
  const deptData = departments.map((d) => ({
    name: d.department_name,
    value: employees.filter((e) => e.department === d.id).length,
  }));

  // Attendance trend (last 7 days by attendance_date)
  const byDate = new Map<string, { date: string; present: number; late: number; absent: number }>();
  for (const r of attendance) {
    if (!byDate.has(r.attendance_date))
      byDate.set(r.attendance_date, { date: r.attendance_date, present: 0, late: 0, absent: 0 });
    const slot = r.status === "on_leave" ? "absent" : r.status as "present" | "late" | "absent";
    byDate.get(r.attendance_date)![slot]++;
  }
  const trend = Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  // Salary distribution — Django salary is a string decimal
  const buckets = [
    { name: "<1k",   value: 0 },
    { name: "1-2k",  value: 0 },
    { name: "2-4k",  value: 0 },
    { name: ">4k",   value: 0 },
  ];
  for (const e of employees) {
    const s = parseFloat(e.salary);
    if (s < 1000) buckets[0].value++;
    else if (s < 2000) buckets[1].value++;
    else if (s < 4000) buckets[2].value++;
    else buckets[3].value++;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.role === "admin" ? "Admin" : "HR"}`}
        description="Here's what's happening across your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees"    value={employees.length} delta="+3 this month" icon={Users}        tone="primary" />
        <StatCard label="Active"             value={active}           delta={`${Math.round((active / Math.max(1, employees.length)) * 100)}% of workforce`} icon={UserCheck} tone="accent" />
        <StatCard label="Departments"        value={departments.length} icon={Building2} tone="warning" />
        <StatCard label="Positions"          value={positions.length}   icon={Briefcase} tone="primary" />
        <StatCard label="On Leave"           value={onLeaveCount}       icon={PalmtreeIcon} tone="warning" />
        <StatCard label="Today's Attendance" value={todayPresent} delta={today} icon={ClockArrowUp} tone="accent" />
        <StatCard label="Pending Leaves"     value={pendingLeaves}      icon={CalendarClock} tone="destructive" />
        <StatCard label="Monthly Payroll"    value={`$${(totalSalary / 12 / 1000).toFixed(1)}k`} delta="across all teams" icon={Wallet} tone="primary" />
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
              <Line type="monotone" dataKey="present" stroke="var(--primary)"     strokeWidth={2} />
              <Line type="monotone" dataKey="late"    stroke="var(--warning)"     strokeWidth={2} />
              <Line type="monotone" dataKey="absent"  stroke="var(--destructive)" strokeWidth={2} />
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
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {deptData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
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
              const emp = employees.find((e) => e.id === l.employee);
              const name = emp ? `${emp.user.first_name} ${emp.user.last_name}` : "—";
              return (
                <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {l.leave_type} · {l.start_date}
                    </div>
                  </div>
                  <Badge
                    variant={
                      l.status === "approved"
                        ? "default"
                        : l.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize text-[10px]"
                  >
                    {l.status}
                  </Badge>
                </div>
              );
            })}
            {leaves.length === 0 && (
              <p className="text-xs text-muted-foreground">No leave requests yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Employee dashboard ───────────────────────────────────────────────────────
function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: employees }  = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: leaves }     = useLeaves();
  const { data: payrolls }   = usePayroll();

  const me = employees.find((e) => e.id === user?.employeeId) ?? employees[0];
  if (!me) return <div className="text-muted-foreground">Loading your profile…</div>;

  const myAtt    = attendance.filter((a) => a.employee === me.id);
  const present  = myAtt.filter((a) => a.status === "present").length;
  const late     = myAtt.filter((a) => a.status === "late").length;
  const absent   = myAtt.filter((a) => a.status === "absent").length;
  const onLeave  = myAtt.filter((a) => a.status === "on_leave").length;
  const rate     = Math.round((present / Math.max(1, myAtt.length)) * 100);
  const myLeaves = leaves.filter((l) => l.employee === me.id);
  const myPay    = payrolls.filter((p) => p.employee === me.id);
  const latestPay = myPay.sort((a, b) => b.pay_date.localeCompare(a.pay_date))[0];

  const attendanceDistribution = [
    { name: "Present", value: present },
    { name: "Late", value: late },
    { name: "Absent", value: absent },
    { name: "On leave", value: onLeave },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${me.user.first_name}`}
        description="Your personal HR overview."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance"     value={`${rate}%`}   delta={`${present}/${myAtt.length} days`} icon={CalendarClock} tone="primary" />
        <StatCard label="Leave Balance"  value={`${20 - myLeaves.filter((l) => l.status === "approved").length} d`} icon={Users} tone="accent" />
        <StatCard label="Latest Salary"  value={latestPay ? `$${parseFloat(latestPay.total_salary).toFixed(0)}` : "—"} icon={Wallet} tone="warning" />
        <StatCard label="Department"     value={`#${me.department}`} icon={Building2} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">My attendance</h3>
              <p className="text-xs text-muted-foreground">Last recorded records</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              {rate}% on time
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={myAtt.slice(-7).map((record) => ({
              date: record.attendance_date,
              value: record.status === "present" ? 1 : 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-1">Attendance breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">By status</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={attendanceDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {attendanceDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
            {attendanceDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span className="truncate text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Manager dashboard ────────────────────────────────────────────────────────
function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: employees }  = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: leaves }     = useLeaves();

  const me     = employees.find((e) => e.id === user?.employeeId);
  if (!me) return <div className="text-muted-foreground">Loading your profile…</div>;

  const myDept = me.department;
  const team   = employees.filter((e) => e.department === myDept && e.id !== me.id);
  const teamIds = new Set(team.map((t) => t.id));

  const today = attendance.length
    ? attendance.slice().sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))[0].attendance_date
    : "";
  const todayPresent = attendance.filter(
    (a) => a.attendance_date === today && teamIds.has(a.employee) && a.status === "present"
  ).length;
  const pendingTeamLeaves = leaves.filter(
    (l) => l.status === "pending" && teamIds.has(l.employee)
  ).length;
  const teamAtt  = attendance.filter((a) => teamIds.has(a.employee));
  const rate     = Math.round(
    (teamAtt.filter((a) => a.status === "present").length / Math.max(1, teamAtt.length)) * 100
  );

  const byDate = new Map<string, { date: string; present: number; absent: number }>();
  for (const r of teamAtt) {
    if (!byDate.has(r.attendance_date))
      byDate.set(r.attendance_date, { date: r.attendance_date, present: 0, absent: 0 });
    if (r.status === "present") byDate.get(r.attendance_date)!.present++;
    if (r.status === "absent" || r.status === "on_leave") byDate.get(r.attendance_date)!.absent++;
  }
  const trend = Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${me?.user.first_name ?? "Manager"}`}
        description={`Managing Department #${myDept ?? "—"}.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team Members"    value={team.length}        icon={Users}         tone="primary" />
        <StatCard label="Present Today"   value={todayPresent} delta={today} icon={UserCheck}  tone="accent" />
        <StatCard label="Pending Leaves"  value={pendingTeamLeaves}  icon={CalendarClock} tone="warning" />
        <StatCard label="Attendance Rate" value={`${rate}%`}         icon={TrendingUp}    tone="primary" />
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
            <Line type="monotone" dataKey="present" stroke="var(--primary)"     strokeWidth={2} />
            <Line type="monotone" dataKey="absent"  stroke="var(--destructive)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}