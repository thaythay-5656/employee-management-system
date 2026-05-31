import type {
  Announcement,
  AttendanceRecord,
  Department,
  Employee,
  LeaveRequest,
  User,
} from "@/types";

const departments: Department[] = [
  { id: "d1", name: "Engineering", description: "Builds the product", managerId: "e1" },
  { id: "d2", name: "Design", description: "Owns user experience", managerId: "e2" },
  { id: "d3", name: "Human Resources", description: "People operations" },
  { id: "d4", name: "Marketing", description: "Brand & growth" },
  { id: "d5", name: "Finance", description: "Money & ops" },
];

const positions = [
  "Software Engineer",
  "Senior Engineer",
  "Product Designer",
  "HR Specialist",
  "Marketing Manager",
  "Financial Analyst",
  "Engineering Manager",
  "QA Engineer",
];

const firstNames = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Skyler", "Drew", "Reese", "Hayden", "Parker", "Rowan"];
const lastNames = ["Carter", "Patel", "Nguyen", "Khan", "Silva", "Müller", "Tanaka", "Okafor", "Rossi", "Andersson", "Garcia", "Kim", "Dubois", "Park", "Ivanov"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEmployees(): Employee[] {
  const emps: Employee[] = [];
  for (let i = 1; i <= 24; i++) {
    const fn = rand(firstNames);
    const ln = rand(lastNames);
    emps.push({
      id: `e${i}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@acme.co`,
      phone: `+1 555 0${100 + i}`,
      address: `${100 + i} Market Street, San Francisco`,
      gender: i % 2 === 0 ? "female" : "male",
      dateOfBirth: `199${i % 10}-0${(i % 9) + 1}-15`,
      position: rand(positions),
      department: rand(departments).name,
      salary: 55000 + Math.floor(Math.random() * 80000),
      joinDate: `202${i % 5}-0${(i % 9) + 1}-10`,
      emergencyContact: `+1 555 0${200 + i}`,
      status: i % 11 === 0 ? "inactive" : i % 7 === 0 ? "on-leave" : "active",
    });
  }
  return emps;
}

function makeAttendance(employees: Employee[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  for (const emp of employees) {
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const r = Math.random();
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
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

const announcements: Announcement[] = [
  {
    id: "a1",
    title: "Q2 All-Hands Meeting",
    body: "Join us this Friday at 3pm in the main hall for our quarterly company update.",
    pinned: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    author: "HR Team",
  },
  {
    id: "a2",
    title: "New Health Insurance Plan",
    body: "Our updated health benefits package is now available. Check the portal for details.",
    pinned: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    author: "HR Team",
  },
  {
    id: "a3",
    title: "Office Closed May 27",
    body: "The office will be closed for Memorial Day. Enjoy the long weekend!",
    pinned: false,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    author: "Admin",
  },
];

export function seedDatabase() {
  const employees = makeEmployees();
  const users: User[] = [
    { id: "u1", email: "admin@acme.co", password: "admin123", role: "admin" },
    { id: "u2", email: "hr@acme.co", password: "hr123", role: "hr" },
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
    attendance: makeAttendance(employees),
    leaves: makeLeaves(employees),
    announcements,
  };
}