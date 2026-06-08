import type {
  Announcement,
  AttendanceRecord,
  Department,
  Employee,
  LeaveRequest,
  Position,
  AuditLog,
  Notification,
  PayrollRecord,
  User,
} from "@/types";

const departments: Department[] = [
  { id: "d1", name: "Engineering", description: "Builds the product", managerId: "e1" },
  { id: "d2", name: "Design", description: "Owns user experience", managerId: "e2" },
  { id: "d3", name: "Human Resources", description: "People operations" },
  { id: "d4", name: "Marketing", description: "Brand & growth" },
  { id: "d5", name: "Finance", description: "Money & ops" },
];

const positionTitles = [
  "Software Developer",
  "UX/UI Designer",
  "HR",
  "Engineering Manager",
];

const positions: Position[] = [
  { id: "p1", title: "Software Developer", department: "Engineering", grade: "Mid", baseSalary: 85000 },
  { id: "p2", title: "Senior Software Developer", department: "Engineering", grade: "Senior", baseSalary: 120000 },
  { id: "p3", title: "UX/UI Designer", department: "Design", grade: "Mid", baseSalary: 78000 },
  { id: "p4", title: "HR", department: "Human Resources", grade: "Mid", baseSalary: 65000 },
  { id: "p5", title: "Marketing Lead", department: "Marketing", grade: "Lead", baseSalary: 95000 },
  { id: "p6", title: "Financial Analyst", department: "Finance", grade: "Mid", baseSalary: 80000 },
  { id: "p7", title: "Engineering Manager", department: "Engineering", grade: "Manager", baseSalary: 145000 },
];

const firstNames = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Skyler", "Drew", "Reese", "Hayden", "Parker", "Rowan"];
const lastNames = ["Carter", "Patel", "Nguyen", "Khan", "Silva", "Müller", "Tanaka", "Okafor", "Rossi", "Andersson", "Garcia", "Kim", "Dubois", "Park", "Ivanov"];

// Deterministic PRNG so SSR + client render identical seed data.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260101);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// Use a fixed "now" reference to keep all derived dates deterministic.
const REF_NOW = new Date("2026-06-01T09:00:00Z");

function makeEmployees(): Employee[] {
  const emps: Employee[] = [];
  for (let i = 1; i <= 24; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const dept = departments[i % departments.length].name;
    const pos = positionTitles[i % positionTitles.length];
    const role: "manager" | "employee" = i % 8 === 0 ? "manager" : "employee";
    emps.push({
      id: `e${i}`,
      fullName: `${fn} ${ln}`,
      firstName: fn,
      lastName: ln,
      username: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}`,
      password: "demo1234",
      role,
      hireDate: `202${i % 5}-0${(i % 9) + 1}-10`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@acme.co`,
      phone: `+1 555 0${100 + i}`,
      address: `${100 + i} Market Street, San Francisco`,
      gender: i % 2 === 0 ? "female" : "male",
      dateOfBirth: `199${i % 10}-0${(i % 9) + 1}-15`,
      position: pos,
      department: dept,
      salary: 55000 + ((i * 7919) % 80000),
      joinDate: `202${i % 5}-0${(i % 9) + 1}-10`,
      emergencyContact: `+1 555 0${200 + i}`,
      status: i % 11 === 0 ? "inactive" : i % 7 === 0 ? "on-leave" : "active",
    });
  }
  return emps;
}

function makeAttendance(employees: Employee[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = REF_NOW;
  for (let ei = 0; ei < employees.length; ei++) {
    const emp = employees[ei];
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const r = ((ei + 1) * (d + 7) * 9301 + 49297) % 233280 / 233280;
      const status: AttendanceRecord["status"] =
        r > 0.92 ? "absent" : r > 0.82 ? "late" : "present";
      records.push({
        id: `${emp.id}-${date.toISOString().slice(0, 10)}`,
        employeeId: emp.id,
        date: date.toISOString().slice(0, 10),
        checkIn: status === "absent" ? undefined : status === "late" ? "09:42" : "08:58",
        checkOut: status === "absent" ? undefined : "17:35",
        status,
      });
    }
  }
  return records;
}

function makeLeaves(employees: Employee[]): LeaveRequest[] {
  return employees.slice(0, 8).map((e, i) => ({
    id: `l${i + 1}`,
    employeeId: e.id,
    type: (["vacation", "sick", "emergency", "unpaid"] as const)[i % 4],
    startDate: `2026-0${(i % 9) + 1}-10`,
    endDate: `2026-0${(i % 9) + 1}-${12 + i}`,
    reason: ["Family event", "Doctor's appointment", "Personal", "Travel"][i % 4],
    status: (["pending", "approved", "rejected"] as const)[i % 3],
    createdAt: new Date(REF_NOW.getTime() - i * 86400000).toISOString(),
  }));
}

function makePayrolls(employees: Employee[]): PayrollRecord[] {
  const months = ["2026-03", "2026-04", "2026-05"];
  const out: PayrollRecord[] = [];
  for (const e of employees) {
    for (const m of months) {
      const base = e.salary / 12;
      const bonus = base * 0.1;
      const tax = base * 0.18;
      const deductions = base * 0.04;
      const net = base + bonus - tax - deductions;
      out.push({
        id: `${e.id}-${m}`,
        employeeId: e.id,
        month: m,
        base, bonus, tax, deductions, net,
        status: "paid",
        generatedAt: REF_NOW.toISOString(),
      });
    }
  }
  return out;
}

const announcements: Announcement[] = [
  {
    id: "a1",
    title: "Q2 All-Hands Meeting",
    body: "Join us this Friday at 3pm in the main hall for our quarterly company update.",
    pinned: true,
    createdAt: new Date(REF_NOW.getTime() - 86400000).toISOString(),
    author: "HR Team",
  },
  {
    id: "a2",
    title: "New Health Insurance Plan",
    body: "Our updated health benefits package is now available. Check the portal for details.",
    pinned: false,
    createdAt: new Date(REF_NOW.getTime() - 3 * 86400000).toISOString(),
    author: "HR Team",
  },
  {
    id: "a3",
    title: "Office Closed May 27",
    body: "The office will be closed for Memorial Day. Enjoy the long weekend!",
    pinned: false,
    createdAt: new Date(REF_NOW.getTime() - 7 * 86400000).toISOString(),
    author: "Admin",
  },
];

const auditLogs: AuditLog[] = [
  { id: "log1", actor: "admin@acme.co", action: "Created employee", target: "Alex Carter", createdAt: new Date(REF_NOW.getTime() - 2 * 3600000).toISOString() },
  { id: "log2", actor: "hr@acme.co", action: "Approved leave", target: "Jordan Patel", createdAt: new Date(REF_NOW.getTime() - 6 * 3600000).toISOString() },
  { id: "log3", actor: "admin@acme.co", action: "Generated payroll", target: "2026-05", createdAt: new Date(REF_NOW.getTime() - 24 * 3600000).toISOString() },
];

const notifications: Notification[] = [
  { id: "n1", title: "New leave request", body: "Sam Nguyen requested 3 vacation days.", createdAt: new Date(REF_NOW.getTime() - 30 * 60000).toISOString(), read: false, forRole: "admin" },
  { id: "n2", title: "Payroll generated", body: "May 2026 payroll is ready for review.", createdAt: new Date(REF_NOW.getTime() - 2 * 3600000).toISOString(), read: false, forRole: "admin" },
  { id: "n3", title: "Announcement posted", body: "Q2 All-Hands Meeting", createdAt: new Date(REF_NOW.getTime() - 86400000).toISOString(), read: true },
];

export function seedDatabase() {
  const employees = makeEmployees();
  // Pick first manager-roled employee as Engineering manager
  const firstManager = employees.find((e) => e.role === "manager");
  if (firstManager) {
    const eng = departments.find((d) => d.name === "Engineering");
    if (eng) eng.managerId = firstManager.id;
  }
  const users: User[] = [
    { id: "u1", email: "admin@acme.co", password: "admin123", role: "admin" },
    { id: "u2", email: "hr@acme.co", password: "hr123", role: "hr" },
    {
      id: "u4",
      email: "manager@acme.co",
      password: "manager123",
      role: "manager",
      employeeId: firstManager?.id,
    },
    {
      id: "u3",
      email: "employee@acme.co",
      password: "employee123",
      role: "employee",
      employeeId: employees[0].id,
    },
  ];
  return {
    users,
    employees,
    departments,
    positions,
    attendance: makeAttendance(employees),
    leaves: makeLeaves(employees),
    payrolls: makePayrolls(employees),
    announcements,
    auditLogs,
    notifications,
  };
}