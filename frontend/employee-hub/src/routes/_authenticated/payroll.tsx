import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { exportToExcel } from "@/lib/export";
import { usePayrolls, useCreatePayroll } from "@/api/queries/usePayrolls";
import { useEmployees } from "@/api/queries/useEmployees";
import type { Employee } from "@/types/api";

export const Route = createFileRoute("/_authenticated/payroll")({
  component: PayrollPage,
});

const schema = z.object({
  employee: z.coerce.number().min(1, "Required"),
  pay_date: z.string().min(1, "Required"),
  basic_salary: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0),
  deduction: z.coerce.number().min(0),
});
type FormValues = z.infer<typeof schema>;

function employeeName(e: Employee | undefined) {
  if (!e) return "—";
  const full = `${e.user.first_name} ${e.user.last_name}`.trim();
  return full || e.user.username;
}

function PayrollPage() {
  const user = useAuthStore((s) => s.user);
  const isEmployee = user?.role === "employee";

  const { data: payrolls = [], isLoading } = usePayrolls();
  const { data: employees = [] } = useEmployees();
  const createPayroll = useCreatePayroll();

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const [open, setOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");

  const months = useMemo(
    () => Array.from(new Set(payrolls.map((p) => p.pay_date.slice(0, 7)))).sort().reverse(),
    [payrolls]
  );

  const list = payrolls.filter(
    (p) => monthFilter === "all" || p.pay_date.startsWith(monthFilter)
  );
  const totalNet = list.reduce((s, p) => s + Number(p.total_salary || 0), 0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee: employees[0]?.id ?? 0,
      pay_date: "",
      basic_salary: 0,
      bonus: 0,
      deduction: 0,
    },
  });

  const onSubmit = (v: FormValues) => {
    if (!v.employee) {
      toast.error("Please select an employee");
      return;
    }
    createPayroll.mutate(
      {
        employee: v.employee,
        pay_date: v.pay_date,
        basic_salary: String(v.basic_salary),
        bonus: String(v.bonus),
        deduction: String(v.deduction),
      },
      {
        onSuccess: () => {
          toast.success("Payroll record created");
          setOpen(false);
          form.reset({
            employee: employees[0]?.id ?? 0,
            pay_date: "",
            basic_salary: 0,
            bonus: 0,
            deduction: 0,
          });
        },
        onError: () => toast.error("Failed to create payroll record"),
      }
    );
  };

  const exportSheet = () => {
    exportToExcel(
      list.map((p) => ({
        Employee: employeeName(employeeMap.get(p.employee)),
        "Pay Date": p.pay_date,
        "Basic Salary": p.basic_salary,
        Bonus: p.bonus,
        Deduction: p.deduction,
        "Total Salary": p.total_salary,
      })),
      `payroll-${monthFilter === "all" ? "all" : monthFilter}`
    );
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading payroll…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My Payslips" : "Payroll"}
        description={isEmployee ? "Your salary history." : "Salary records and breakdowns."}
        actions={
          !isEmployee && (
            <div className="flex gap-2">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" onClick={exportSheet}>
                <Download className="h-3.5 w-3.5 mr-1" /> Excel
              </Button>

              {/* ✅ Full dialog with trigger and content */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New payroll record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Employee</Label>
                      <Select
                        defaultValue={employees[0] ? String(employees[0].id) : undefined}
                        onValueChange={(v) => form.setValue("employee", Number(v))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                        <SelectContent>
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              {employeeName(e)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.employee && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.employee.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Pay date</Label>
                      <Input type="date" {...form.register("pay_date")} />
                      {form.formState.errors.pay_date && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.pay_date.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Basic salary</Label>
                        <Input type="number" step="0.01" {...form.register("basic_salary")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Bonus</Label>
                        <Input type="number" step="0.01" {...form.register("bonus")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Deduction</Label>
                        <Input type="number" step="0.01" {...form.register("deduction")} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={createPayroll.isPending}
                    >
                      {createPayroll.isPending ? "Creating…" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )
        }
      />

      {!isEmployee && (
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total net {monthFilter === "all" ? "(all time)" : `for ${monthFilter}`}
          </div>
          <div className="text-2xl font-semibold">
            ${totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                {!isEmployee && <th className="text-left px-4 py-3 font-medium">Employee</th>}
                <th className="text-left px-4 py-3 font-medium">Pay Date</th>
                <th className="text-left px-4 py-3 font-medium">Basic Salary</th>
                <th className="text-left px-4 py-3 font-medium">Bonus</th>
                <th className="text-left px-4 py-3 font-medium">Deduction</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  {!isEmployee && (
                    <td className="px-4 py-3 font-medium">
                      {employeeName(employeeMap.get(p.employee))}
                    </td>
                  )}
                  <td className="px-4 py-3 text-muted-foreground">{p.pay_date}</td>
                  <td className="px-4 py-3">${Number(p.basic_salary).toFixed(0)}</td>
                  <td className="px-4 py-3 text-accent">+${Number(p.bonus).toFixed(0)}</td>
                  <td className="px-4 py-3 text-destructive">-${Number(p.deduction).toFixed(0)}</td>
                  <td className="px-4 py-3 font-semibold">${Number(p.total_salary).toFixed(0)}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={isEmployee ? 5 : 6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No payslips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}