// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import { Plus, Search, MoreHorizontal, Edit2, Trash2, Download } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";
// import { PageHeader } from "@/components/layout/page-header";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { useDataStore } from "@/store/data-store";
// import { useAuthStore } from "@/store/auth-store";
// import { exportToExcel, exportTableToPDF } from "@/lib/export";
// import type { Employee } from "@/types";

// export const Route = createFileRoute("/_authenticated/employees")({
//   component: EmployeesPage,
// });

// const schema = z.object({
//   firstName: z.string().min(1, "Required"),
//   lastName: z.string().min(1, "Required"),
//   username: z.string().min(2, "Required"),
//   password: z.string().min(4, "Min 4 chars"),
//   email: z.string().email(),
//   phone: z.string().min(5),
//   position: z.enum(["HR", "UX/UI Designer", "Software Developer", "Engineering Manager"]),
//   department: z.string().min(2),
//   salary: z.coerce.number().min(0),
//   hireDate: z.string().min(1, "Required"),
//   gender: z.enum(["male", "female", "other"]),
//   role: z.enum(["manager", "employee"]),
//   status: z.enum(["active", "inactive", "on-leave"]),
// });
// type FormValues = z.infer<typeof schema>;

// const POSITIONS = ["HR", "UX/UI Designer", "Software Developer", "Engineering Manager"] as const;

// function EmployeesPage() {
//   const { employees, departments, addEmployee, updateEmployee, deleteEmployee, logAudit } = useDataStore();
//   const user = useAuthStore((s) => s.user);
//   const myEmpId = user?.employeeId;
//   const me = employees.find((e) => e.id === myEmpId);
//   const isManager = user?.role === "manager";
//   const canMutate = user?.role === "admin" || user?.role === "hr";
//   const [q, setQ] = useState("");
//   const [dept, setDept] = useState<string>("all");
//   const [status, setStatus] = useState<string>("all");
//   const [page, setPage] = useState(1);
//   const [editing, setEditing] = useState<Employee | null>(null);
//   const [open, setOpen] = useState(false);

//   const scoped = isManager && me ? employees.filter((e) => e.department === me.department) : employees;
//   const filtered = scoped.filter(
//     (e) =>
//       (dept === "all" || e.department === dept) &&
//       (status === "all" || e.status === status) &&
//       (e.fullName.toLowerCase().includes(q.toLowerCase()) ||
//         e.email.toLowerCase().includes(q.toLowerCase()) ||
//         e.position.toLowerCase().includes(q.toLowerCase())),
//   );
//   const pageSize = 8;
//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

//   const form = useForm<FormValues>({ resolver: zodResolver(schema) });

//   const onOpenChange = (next: boolean) => {
//     setOpen(next);
//     if (!next) {
//       setEditing(null);
//       form.reset();
//     }
//   };

//   const onEdit = (e: Employee) => {
//     setEditing(e);
//     const [fn, ...rest] = (e.fullName ?? "").split(" ");
//     form.reset({
//       firstName: e.firstName ?? fn ?? "",
//       lastName: e.lastName ?? rest.join(" "),
//       username: e.username ?? e.email.split("@")[0],
//       password: e.password ?? "",
//       email: e.email,
//       phone: e.phone,
//       position: (POSITIONS as readonly string[]).includes(e.position)
//         ? (e.position as FormValues["position"])
//         : "Software Developer",
//       department: e.department,
//       salary: e.salary,
//       hireDate: e.hireDate ?? e.joinDate,
//       gender: e.gender,
//       role: e.role ?? "employee",
//       status: e.status,
//     });
//     setOpen(true);
//   };

//   const onSubmit = (values: FormValues) => {
//     const fullName = `${values.firstName} ${values.lastName}`.trim();
//     if (editing) {
//       updateEmployee(editing.id, { ...values, fullName });
//       logAudit(user?.email ?? "system", "Updated employee", fullName);
//       toast.success("Employee updated");
//     } else {
//       addEmployee({
//         ...values,
//         fullName,
//         address: "",
//         dateOfBirth: "1990-01-01",
//         joinDate: values.hireDate,
//         emergencyContact: "",
//       });
//       logAudit(user?.email ?? "system", "Created employee", fullName);
//       toast.success("Employee added");
//     }
//     onOpenChange(false);
//   };

//   const handleDelete = (e: Employee) => {
//     deleteEmployee(e.id);
//     logAudit(user?.email ?? "system", "Deleted employee", e.fullName);
//     toast.success(`Removed ${e.fullName}`);
//   };

//   const onExportExcel = () => {
//     exportToExcel(
//       filtered.map((e) => ({
//         Name: e.fullName, Email: e.email, Department: e.department,
//         Position: e.position, Salary: e.salary, Status: e.status, "Hire Date": e.hireDate ?? e.joinDate,
//       })),
//       "employees",
//     );
//   };
//   const onExportPDF = () => {
//     exportTableToPDF(
//       "Employees",
//       ["Name", "Email", "Department", "Position", "Salary", "Status"],
//       filtered.map((e) => [e.fullName, e.email, e.department, e.position, `$${e.salary}`, e.status]),
//       "employees",
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title={isManager ? "My team" : "Employees"}
//         description={isManager ? "View employees in your department." : "Manage your workforce, profiles, and employment status."}
//         actions={
//           <div className="flex gap-2">
//             <Button variant="outline" size="sm" onClick={onExportExcel}><Download className="h-3.5 w-3.5 mr-1" /> Excel</Button>
//             <Button variant="outline" size="sm" onClick={onExportPDF}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
//             {canMutate && (
//             <Dialog open={open} onOpenChange={onOpenChange}>
//             <DialogTrigger asChild>
//               <Button>
//                 <Plus className="h-4 w-4 mr-1" /> Add Employee
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-lg">
//               <DialogHeader>
//                 <DialogTitle>{editing ? "Edit employee" : "Add new employee"}</DialogTitle>
//               </DialogHeader>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
//                 <div className="space-y-2">
//                   <Label>First name</Label>
//                   <Input {...form.register("firstName")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Last name</Label>
//                   <Input {...form.register("lastName")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Username</Label>
//                   <Input {...form.register("username")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Password</Label>
//                   <Input type="password" {...form.register("password")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Email</Label>
//                   <Input type="email" {...form.register("email")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Phone</Label>
//                   <Input {...form.register("phone")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Position</Label>
//                   <Select
//                     defaultValue={editing?.position as string | undefined}
//                     onValueChange={(v) => form.setValue("position", v as FormValues["position"])}
//                   >
//                     <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
//                     <SelectContent>
//                       {POSITIONS.map((p) => (
//                         <SelectItem key={p} value={p}>{p}</SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Department</Label>
//                   <Select
//                     defaultValue={editing?.department}
//                     onValueChange={(v) => form.setValue("department", v)}
//                   >
//                     <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
//                     <SelectContent>
//                       {departments.map((d) => (
//                         <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Salary</Label>
//                   <Input type="number" {...form.register("salary")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Hire date</Label>
//                   <Input type="date" {...form.register("hireDate")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Gender</Label>
//                   <Select
//                     defaultValue={editing?.gender ?? "male"}
//                     onValueChange={(v) => form.setValue("gender", v as FormValues["gender"])}
//                   >
//                     <SelectTrigger><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="male">Male</SelectItem>
//                       <SelectItem value="female">Female</SelectItem>
//                       <SelectItem value="other">Other</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Role</Label>
//                   <Select
//                     defaultValue={editing?.role ?? "employee"}
//                     onValueChange={(v) => form.setValue("role", v as FormValues["role"])}
//                   >
//                     <SelectTrigger><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="manager">Manager</SelectItem>
//                       <SelectItem value="employee">Employee</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Status</Label>
//                   <Select
//                     defaultValue={editing?.status ?? "active"}
//                     onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
//                   >
//                     <SelectTrigger><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="active">Active</SelectItem>
//                       <SelectItem value="on-leave">On leave</SelectItem>
//                       <SelectItem value="inactive">Inactive</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <DialogFooter className="col-span-2">
//                   <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
//                   <Button type="submit">{editing ? "Save changes" : "Add employee"}</Button>
//                 </DialogFooter>
//               </form>
//             </DialogContent>
//             </Dialog>
//             )}
//           </div>
//         }
//       />

//       <div className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-3">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search by name, email, position…"
//             className="pl-9"
//             value={q}
//             onChange={(e) => { setQ(e.target.value); setPage(1); }}
//           />
//         </div>
//         <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
//           <SelectTrigger className="sm:w-48"><SelectValue placeholder="Department" /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All departments</SelectItem>
//             {departments.map((d) => (
//               <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//         <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
//           <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All status</SelectItem>
//             <SelectItem value="active">Active</SelectItem>
//             <SelectItem value="on-leave">On leave</SelectItem>
//             <SelectItem value="inactive">Inactive</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="glass rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
//               <tr>
//                 <th className="text-left px-4 py-3 font-medium">Employee</th>
//                 <th className="text-left px-4 py-3 font-medium">Department</th>
//                 <th className="text-left px-4 py-3 font-medium">Position</th>
//                 <th className="text-left px-4 py-3 font-medium">Salary</th>
//                 <th className="text-left px-4 py-3 font-medium">Status</th>
//                 <th className="w-10 px-4 py-3"></th>
//               </tr>
//             </thead>
//             <tbody>
//               {paged.map((e) => (
//                 <tr key={e.id} className="border-t border-border hover:bg-muted/20">
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-3">
//                       <Avatar className="h-9 w-9">
//                         <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
//                           {e.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div>
//                         <div className="font-medium">{e.fullName}</div>
//                         <div className="text-xs text-muted-foreground">{e.email}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3 text-muted-foreground">{e.department}</td>
//                   <td className="px-4 py-3 text-muted-foreground">{e.position}</td>
//                   <td className="px-4 py-3 font-medium">${e.salary.toLocaleString()}</td>
//                   <td className="px-4 py-3">
//                     <Badge
//                       variant={e.status === "active" ? "default" : e.status === "on-leave" ? "secondary" : "outline"}
//                       className="capitalize"
//                     >
//                       {e.status}
//                     </Badge>
//                   </td>
//                   <td className="px-4 py-3">
//                       {canMutate ? (
//                       <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onClick={() => onEdit(e)}>
//                           <Edit2 className="h-4 w-4 mr-2" /> Edit
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           className="text-destructive"
//                           onClick={() => handleDelete(e)}
//                         >
//                           <Trash2 className="h-4 w-4 mr-2" /> Delete
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                       </DropdownMenu>
//                       ) : <span className="text-xs text-muted-foreground">—</span>}
//                   </td>
//                 </tr>
//               ))}
//               {paged.length === 0 && (
//                 <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No employees found.</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
//           <span className="text-muted-foreground">
//             Showing {paged.length} of {filtered.length}
//           </span>
//           <div className="flex gap-2">
//             <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
//             <span className="px-3 py-1.5 text-xs">Page {page} of {totalPages}</span>
//             <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit2, Trash2, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEmployees, useEmployeeMutations, useDepartments, usePositions } from "@/hooks/useEMS";
import { useAuthStore } from "@/store/auth-store";
import { exportToExcel, exportTableToPDF } from "@/lib/export";
import type { Employee, CreateEmployeePayload } from "@/api/services";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

const schema = z.object({
  firstName:   z.string().min(1, "Required"),
  lastName:    z.string().min(1, "Required"),
  username:    z.string().min(2, "Required"),
  // password optional on edit — validated contextually in onSubmit
  password:    z.string(),
  email:       z.string().email("Valid email required"),
  phone:       z.string().min(5, "Required"),
  gender:      z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1, "Required"),
  address:     z.string().min(1, "Required"),
  hireDate:    z.string().min(1, "Required"),
  salary:      z.coerce.number().min(0, "Required"),
  role:        z.enum(["manager", "employee"]),
  status:      z.enum(["active", "inactive", "terminated"]),
  department:  z.coerce.number().min(1, "Select a department"),
  position:    z.coerce.number().min(1, "Select a position"),
});
type FormValues = z.infer<typeof schema>;

function EmployeesPage() {
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === "admin";
  const isManager = user?.role === "manager";

  const { data: employees, loading, refetch } = useEmployees();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployeeMutations(refetch);

  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName:   "",
      lastName:    "",
      username:    "",
      password:    "",
      email:       "",
      phone:       "",
      address:     "",
      dateOfBirth: "",
      hireDate:    "",
      salary:      0,
      gender:      "male",
      role:        "employee",
      status:      "active",
      department:  departments[0]?.id ?? 0,
      position:    positions[0]?.id  ?? 0,
    },
  });

  // Helper: full name from nested user object
  const fullName = (e: Employee) =>
    `${e.user.first_name} ${e.user.last_name}`.trim();

  // Scope by role
  const me = employees.find((e) => e.id === user?.employeeId);
  const scoped = isManager && me
    ? employees.filter((e) => e.department === me.department)
    : employees;

  // Apply search + filters
  const filtered = scoped.filter((e) => {
    const name = fullName(e).toLowerCase();
    const matchQ =
      name.includes(q.toLowerCase()) ||
      e.user.email.toLowerCase().includes(q.toLowerCase());
    const matchDept = deptFilter === "all" || e.department === Number(deptFilter);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchQ && matchDept && matchStatus;
  });

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEditing(null);
      form.reset({
        firstName: "", lastName: "", username: "", password: "",
        email: "", phone: "", address: "", dateOfBirth: "", hireDate: "",
        salary: 0,
        gender: "male", role: "employee", status: "active",
        department: departments[0]?.id ?? 0,
        position:   positions[0]?.id  ?? 0,
      });
    }
  };

  const onEdit = (e: Employee) => {
    setEditing(e);
    form.reset({
      firstName:   e.user.first_name,
      lastName:    e.user.last_name,
      username:    e.user.username,
      password:    "",            // never pre-fill password
      email:       e.user.email,
      phone:       e.phone,
      gender:      e.gender,
      dateOfBirth: e.date_of_birth,
      address:     e.address,
      hireDate:    e.hire_date,
      salary:      parseFloat(e.salary),
      role:        e.role === "admin" ? "employee" : e.role,
      status:      e.status === "terminated" ? "terminated" : e.status,
      department:  e.department,
      position:    e.position,
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    // Password required only for new employees
    if (!editing && values.password.length < 4) {
      form.setError("password", { message: "Min 4 characters" });
      return;
    }

    const payload: CreateEmployeePayload = {
      user: {
        username:   values.username,
        password:   values.password,
        first_name: values.firstName,
        last_name:  values.lastName,
        email:      values.email,
      },
      role:          values.role,
      gender:        values.gender,
      date_of_birth: values.dateOfBirth,
      phone:         values.phone,
      address:       values.address,
      hire_date:     values.hireDate,
      salary:        values.salary,
      status:        values.status,
      department:    values.department,
      position:      values.position,
    };

    // Remove password from payload if editing and left blank
    if (editing && !values.password) {
      delete (payload.user as Partial<typeof payload.user>).password;
    }

    try {
      if (editing) {
        await updateEmployee(editing.id, payload);
        toast.success("Employee updated");
      } else {
        await createEmployee(payload);
        toast.success("Employee added");
      }
      onOpenChange(false);
    } catch (err: any) {
      // Show the exact Django validation error so you know what field failed
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        toast.error(messages);
      } else {
        toast.error("Failed to save employee");
      }
    }
  };

  const handleDelete = async (e: Employee) => {
    try {
      await deleteEmployee(e.id);
      toast.success(`Removed ${fullName(e)}`);
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  const getDeptName = (id: number) =>
    departments.find((d) => d.id === id)?.department_name ?? "—";
  const getPosName = (id: number) =>
    positions.find((p) => p.id === id)?.position_name ?? "—";

  const onExportExcel = () => {
    exportToExcel(
      filtered.map((e) => ({
        Name: fullName(e),
        Email: e.user.email,
        Department: getDeptName(e.department),
        Position: getPosName(e.position),
        Salary: e.salary,
        Status: e.status,
        "Hire Date": e.hire_date,
      })),
      "employees"
    );
  };

  const onExportPDF = () => {
    exportTableToPDF(
      "Employees",
      ["Name", "Email", "Department", "Position", "Salary", "Status"],
      filtered.map((e) => [
        fullName(e),
        e.user.email,
        getDeptName(e.department),
        getPosName(e.position),
        `$${e.salary}`,
        e.status,
      ]),
      "employees"
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employees" description="Loading…" />
        <div className="text-muted-foreground text-sm">Fetching employees…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "My team" : "Employees"}
        description={
          isManager
            ? "View employees in your department."
            : "Manage your workforce, profiles, and employment status."
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <Download className="h-3.5 w-3.5 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onExportPDF}>
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>
            {canMutate && (
              <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" /> Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editing ? "Edit employee" : "Add new employee"}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1"
                  >
                    <div className="space-y-2">
                      <Label>First name</Label>
                      <Input {...form.register("firstName")} />
                      {form.formState.errors.firstName && (
                        <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Last name</Label>
                      <Input {...form.register("lastName")} />
                      {form.formState.errors.lastName && (
                        <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input {...form.register("username")} />
                      {form.formState.errors.username && (
                        <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Password {editing && <span className="text-muted-foreground text-xs">(leave blank to keep)</span>}</Label>
                      <Input type="password" {...form.register("password")} />
                      {form.formState.errors.password && (
                        <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" {...form.register("email")} />
                      {form.formState.errors.email && (
                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input {...form.register("phone")} />
                      {form.formState.errors.phone && (
                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Date of birth</Label>
                      <Input type="date" {...form.register("dateOfBirth")} />
                      {form.formState.errors.dateOfBirth && (
                        <p className="text-xs text-destructive">{form.formState.errors.dateOfBirth.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Hire date</Label>
                      <Input type="date" {...form.register("hireDate")} />
                      {form.formState.errors.hireDate && (
                        <p className="text-xs text-destructive">{form.formState.errors.hireDate.message}</p>
                      )}
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Input {...form.register("address")} />
                      {form.formState.errors.address && (
                        <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
                      )}
                    </div>

                    {/* Department — sends ID to Django */}
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={String(form.watch("department") || "")}
                        onValueChange={(v) => form.setValue("department", Number(v), { shouldValidate: true })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.department_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.department && (
                        <p className="text-xs text-destructive">Select a department</p>
                      )}
                    </div>

                    {/* Position — sends ID to Django */}
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select
                        value={String(form.watch("position") || "")}
                        onValueChange={(v) => form.setValue("position", Number(v), { shouldValidate: true })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                        <SelectContent>
                          {positions.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.position_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.position && (
                        <p className="text-xs text-destructive">Select a position</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Salary</Label>
                      <Input type="number" {...form.register("salary")} />
                      {form.formState.errors.salary && (
                        <p className="text-xs text-destructive">{form.formState.errors.salary.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={form.watch("gender")}
                        onValueChange={(v) => form.setValue("gender", v as FormValues["gender"], { shouldValidate: true })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={form.watch("role")}
                        onValueChange={(v) => form.setValue("role", v as FormValues["role"], { shouldValidate: true })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={form.watch("status")}
                        onValueChange={(v) => form.setValue("status", v as FormValues["status"], { shouldValidate: true })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter className="col-span-2">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting
                          ? "Saving…"
                          : editing
                          ? "Save changes"
                          : "Add employee"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setPage(1); }}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.department_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Department</th>
                <th className="text-left px-4 py-3 font-medium">Position</th>
                <th className="text-left px-4 py-3 font-medium">Salary</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                          {fullName(e).split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{fullName(e)}</div>
                        <div className="text-xs text-muted-foreground">{e.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getDeptName(e.department)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getPosName(e.position)}</td>
                  <td className="px-4 py-3 font-medium">
                    ${parseFloat(e.salary).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        e.status === "active"
                          ? "default"
                          : e.status === "inactive"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {e.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canMutate ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(e)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(e)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground">
            Showing {paged.length} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="px-3 py-1.5 text-xs">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}