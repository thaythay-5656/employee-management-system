import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Users, Plus, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/api/queries/useDepartments";
import { useEmployees } from "@/api/queries/useEmployees";
import type { Department } from "@/types/api";

export const Route = createFileRoute("/_authenticated/departments")({
  component: DepartmentsPage,
});

const schema = z.object({
  department_name: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

function employeeName(e: { user: { first_name: string; last_name: string; username: string } }) {
  const full = `${e.user.first_name} ${e.user.last_name}`.trim();
  return full || e.user.username;
}

function DepartmentsPage() {
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === "admin";

  const { data: departments = [], isLoading } = useDepartments();
  const { data: employees = [] } = useEmployees();

  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();

  const [editing, setEditing] = useState<Department | null>(null);
  const [open, setOpen] = useState(false);

  // Hooks can't be created conditionally per-row, so use a single
  // "update by id" pattern: re-create the mutation each render with the
  // currently-edited department's id (0 when none selected, which is fine
  // since the mutation isn't fired unless `editing` is set).
  const updateDept = useUpdateDepartment(editing?.id ?? 0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { department_name: "" },
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEditing(null);
      form.reset({ department_name: "" });
    }
  };

  const onAddNew = () => {
    setEditing(null);
    form.reset({ department_name: "" });
    setOpen(true);
  };

  const onEdit = (d: Department) => {
    setEditing(d);
    form.reset({ department_name: d.department_name });
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateDept.mutate(values, {
        onSuccess: () => {
          toast.success("Department updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update department"),
      });
    } else {
      createDept.mutate(values, {
        onSuccess: () => {
          toast.success("Department added");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to create department"),
      });
    }
  };

  const handleDelete = (d: Department) => {
    deleteDept.mutate(d.id, {
      onSuccess: () => toast.success(`Removed ${d.department_name}`),
      onError: () => toast.error("Failed to delete department. It may still have employees assigned."),
    });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading departments…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Teams and the people in them."
        actions={
          canMutate ? (
            <Dialog open={open} onOpenChange={onOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={onAddNew}>
                  <Plus className="h-4 w-4 mr-1" /> Add Department
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit department" : "Add new department"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Department name</Label>
                    <Input {...form.register("department_name")} />
                    {form.formState.errors.department_name && (
                      <p className="text-xs text-destructive">{form.formState.errors.department_name.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={createDept.isPending || updateDept.isPending}>
                      {editing ? "Save changes" : "Add department"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => {
          const team = employees.filter((e) => e.department === d.id);
          const manager = team.find((e) => e.role === "manager");
          return (
            <div key={d.id} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="font-semibold">{d.department_name}</div>
                </div>
                {canMutate && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(d)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(d)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /> {team.length} members
                </span>
                <span className="text-xs text-muted-foreground">Manager: {manager ? employeeName(manager) : "—"}</span>
              </div>
            </div>
          );
        })}
        {departments.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full text-center py-12">No departments yet.</div>
        )}
      </div>
    </div>
  );
}
