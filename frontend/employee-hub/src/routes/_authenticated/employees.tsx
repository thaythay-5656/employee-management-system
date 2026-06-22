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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { exportToExcel, exportTableToPDF } from "@/lib/export";

import { useEmployees, useCreateEmployee, useUpdateEmployeeById, useDeleteEmployee } from "@/api/queries/useEmployees";
import { useDepartments } from "@/api/queries/useDepartments";
import { usePositions } from "@/api/queries/usePositions";
import type { Employee } from "@/types/api";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  username: z.string().min(2, "Required"),
  password: z.string().optional(), // required on create, optional on edit
  email: z.string().email(),
  phone: z.string().min(5),
  position: z.coerce.number().min(1, "Required"),
  department: z.coerce.number().min(1, "Required"),
  salary: z.coerce.number().min(0),
  hireDate: z.string().min(1, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  gender: z.enum(["male", "female", "other"]),
  role: z.enum(["admin", "manager", "employee"]),
});
type FormValues = z.infer<typeof schema>;

function employeeName(e: Employee) {
  const full = `${e.user.first_name} ${e.user.last_name}`.trim();
  return full || e.user.username;
}

function initials(e: Employee) {
  const name = employeeName(e);
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function EmployeesPage() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === "manager";
  const canMutate = user?.role === "admin";

  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployeeById();
  const deleteEmployee = useDeleteEmployee();

  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);

  // Note: /api/employee/ already scopes results by role server-side
  // (admin = all, manager = role='employee' team, employee = self).
  const filtered = employees.filter((e) => {
    const matchesDept = dept === "all" || e.department === Number(dept);
    const name = employeeName(e).toLowerCase();
    const matchesQuery =
      name.includes(q.toLowerCase()) ||
      e.user.email.toLowerCase().includes(q.toLowerCase()) ||
      e.phone.toLowerCase().includes(q.toLowerCase());
    return matchesDept && matchesQuery;
  });

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEditing(null);
      form.reset();
    }
  };

  const onAddNew = () => {
    setEditing(null);
    form.reset({
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      email: "",
      phone: "",
      position: positions[0]?.id ?? 0,
      department: departments[0]?.id ?? 0,
      salary: 0,
      hireDate: "",
      dateOfBirth: "",
      address: "",
      gender: "male",
      role: "employee",
    });
    setOpen(true);
  };

  const onEdit = (e: Employee) => {
    setEditing(e);
    form.reset({
      firstName: e.user.first_name,
      lastName: e.user.last_name,
      username: e.user.username,
      password: "", // blank = don't change
      email: e.user.email,
      phone: e.phone,
      position: e.position,
      department: e.department,
      salary: Number(e.salary),
      hireDate: e.hire_date,
      dateOfBirth: e.date_of_birth,
      address: e.address,
      gender: e.gender,
      role: e.role,
    });
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      user: {
        username: values.username,
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        is_active: true,
        ...(values.password ? { password: values.password } : {}),
      },
      role: values.role,
      gender: values.gender,
      date_of_birth: values.dateOfBirth,
      phone: values.phone,
      address: values.address,
      hire_date: values.hireDate,
      salary: String(values.salary),
      department: values.department,
      position: values.position,
    };

    if (editing) {
      updateEmployee.mutate(
        { id: editing.id, data: payload as any },
        {
          onSuccess: () => {
            toast.success("Employee updated");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to update employee"),
        }
      );
    } else {
      if (!values.password) {
        form.setError("password", { message: "Required for new employees" });
        return;
      }
      createEmployee.mutate(payload as any, {
        onSuccess: () => {
          toast.success("Employee added");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to create employee"),
      });
    }
  };

  const handleDelete = (e: Employee) => {
    deleteEmployee.mutate(e.id, {
      onSuccess: () => toast.success(`Removed ${employeeName(e)}`),
      onError: () => toast.error("Failed to delete employee"),
    });
  };

  const departmentName = (id: number) => departments.find((d) => d.id === id)?.department_name ?? "—";
  const positionName = (id: number) => positions.find((p) => p.id === id)?.position_name ?? "—";

  const onExportExcel = () => {
    exportToExcel(
      filtered.map((e) => ({
        Name: employeeName(e),
        Email: e.user.email,
        Department: departmentName(e.department),
        Position: positionName(e.position),
        Salary: e.salary,
        "Hire Date": e.hire_date,
      })),
      "employees",
    );
  };
  const onExportPDF = () => {
    exportTableToPDF(
      "Employees",
      ["Name", "Email", "Department", "Position", "Salary"],
      filtered.map((e) => [employeeName(e), e.user.email, departmentName(e.department), positionName(e.position), `$${e.salary}`]),
      "employees",
    );
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading employees…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "My team" : "Employees"}
        description={isManager ? "View employees in your team." : "Manage your workforce, profiles, and employment status."}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportExcel}><Download className="h-3.5 w-3.5 mr-1" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={onExportPDF}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
            {canMutate && (
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={onAddNew}>
                <Plus className="h-4 w-4 mr-1" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit employee" : "Add new employee"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input {...form.register("firstName")} />
                  {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input {...form.register("lastName")} />
                  {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input {...form.register("username")} />
                  {form.formState.errors.username && <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Password {editing && <span className="text-muted-foreground">(leave blank to keep)</span>}</Label>
                  <Input type="password" {...form.register("password")} />
                  {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...form.register("email")} />
                  {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register("phone")} />
                  {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    defaultValue={editing ? String(editing.position) : undefined}
                    onValueChange={(v) => form.setValue("position", Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.position_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.position && <p className="text-xs text-destructive">{form.formState.errors.position.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    defaultValue={editing ? String(editing.department) : undefined}
                    onValueChange={(v) => form.setValue("department", Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.department_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.department && <p className="text-xs text-destructive">{form.formState.errors.department.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Salary</Label>
                  <Input type="number" {...form.register("salary")} />
                </div>
                <div className="space-y-2">
                  <Label>Hire date</Label>
                  <Input type="date" {...form.register("hireDate")} />
                  {form.formState.errors.hireDate && <p className="text-xs text-destructive">{form.formState.errors.hireDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Date of birth</Label>
                  <Input type="date" {...form.register("dateOfBirth")} />
                  {form.formState.errors.dateOfBirth && <p className="text-xs text-destructive">{form.formState.errors.dateOfBirth.message}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input {...form.register("address")} />
                  {form.formState.errors.address && <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    defaultValue={editing?.gender ?? "male"}
                    onValueChange={(v) => form.setValue("gender", v as FormValues["gender"])}
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
                    defaultValue={editing?.role ?? "employee"}
                    onValueChange={(v) => form.setValue("role", v as FormValues["role"])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
                    {editing ? "Save changes" : "Add employee"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
            </Dialog>
            )}
          </div>
        }
      />

      <div className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone…"
            className="pl-9"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>{d.department_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Department</th>
                <th className="text-left px-4 py-3 font-medium">Position</th>
                <th className="text-left px-4 py-3 font-medium">Salary</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
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
                          {initials(e)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employeeName(e)}</div>
                        <div className="text-xs text-muted-foreground">{e.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{departmentName(e.department)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{positionName(e.position)}</td>
                  <td className="px-4 py-3 font-medium">${Number(e.salary).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{e.role}</td>
                  <td className="px-4 py-3">
                      {canMutate ? (
                      <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
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
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground">
            Showing {paged.length} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="px-3 py-1.5 text-xs">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
