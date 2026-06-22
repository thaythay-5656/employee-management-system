import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

import { useLeaves, useCreateLeave, useUpdateLeaveStatus } from "@/api/queries/useLeaves";
import { useEmployees } from "@/api/queries/useEmployees";
import type { Employee, LeaveType } from "@/types/api";

export const Route = createFileRoute("/_authenticated/leave")({
  component: LeavePage,
});

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "annual", label: "Annual" },
  { value: "sick", label: "Sick" },
  { value: "maternity", label: "Maternity" },
  { value: "emergency", label: "Emergency" },
  { value: "unpaid", label: "Unpaid" },
  { value: "other", label: "Other" },
];

const schema = z.object({
  leave_type: z.enum(["annual", "sick", "maternity", "emergency", "unpaid", "other"]),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  reason: z.string().min(3),
});
type FormValues = z.infer<typeof schema>;

function employeeName(e: Employee | undefined) {
  if (!e) return "—";
  const full = `${e.user.first_name} ${e.user.last_name}`.trim();
  return full || e.user.username;
}

function LeavePage() {
  const user = useAuthStore((s) => s.user);
  const isEmployee = user?.role === "employee";

  // /api/leave/ already scopes server-side:
  // admin/manager -> all leaves, employee -> own leaves only.
  const { data: leaves = [], isLoading } = useLeaves();
  const { data: employees = [] } = useEmployees();

  const createLeave = useCreateLeave();
  const updateStatus = useUpdateLeaveStatus();

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // For role=employee, /api/employee/ returns only self -> employees[0] is "me".
  // For admin/manager, /api/employee/ returns all -> find by matching username.
  const me = isEmployee ? employees[0] : employees.find((e) => e.user.username === user?.username);

  const [open, setOpen] = useState(false);
  const [decisionFor, setDecisionFor] = useState<{ id: number; status: "approved" | "rejected" } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leave_type: "annual", start_date: "", end_date: "", reason: "" },
  });

  const onSubmit = (v: FormValues) => {
    if (!me) return;

    createLeave.mutate(
      { ...v, employee: me.id },
      {
        onSuccess: () => {
          toast.success("Leave request submitted");
          setOpen(false);
          form.reset({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
        },
        onError: () => toast.error("Failed to submit leave request"),
      }
    );
  };

  const submitDecision = () => {
    if (!decisionFor) return;

    updateStatus.mutate(
      { id: decisionFor.id, status: decisionFor.status, approvedBy: me?.id },
      {
        onSuccess: () => {
          toast[decisionFor.status === "approved" ? "success" : "error"](
            decisionFor.status === "approved" ? "Approved" : "Rejected"
          );
          setDecisionFor(null);
        },
        onError: () => toast.error("Failed to update leave status"),
      }
    );
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading leave requests…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My leave requests" : "Leave management"}
        description={isEmployee ? "Track your time off and submit new requests." : "Review and approve leave requests."}
        actions={
          isEmployee ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Request leave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New leave request</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select defaultValue="annual" onValueChange={(v) => form.setValue("leave_type", v as FormValues["leave_type"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEAVE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start date</Label>
                      <Input type="date" {...form.register("start_date")} />
                      {form.formState.errors.start_date && (
                        <p className="text-xs text-destructive">{form.formState.errors.start_date.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>End date</Label>
                      <Input type="date" {...form.register("end_date")} />
                      {form.formState.errors.end_date && (
                        <p className="text-xs text-destructive">{form.formState.errors.end_date.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea rows={3} {...form.register("reason")} />
                    {form.formState.errors.reason && (
                      <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createLeave.isPending}>Submit</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                {!isEmployee && <th className="text-left px-4 py-3 font-medium">Employee</th>}
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">From</th>
                <th className="text-left px-4 py-3 font-medium">To</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                {!isEmployee && <th className="text-right px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => {
                const emp = employeeMap.get(l.employee);
                return (
                  <tr key={l.id} className="border-t border-border hover:bg-muted/20">
                    {!isEmployee && <td className="px-4 py-3 font-medium">{employeeName(emp)}</td>}
                    <td className="px-4 py-3 capitalize text-muted-foreground">{l.leave_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.start_date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.end_date}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{l.reason}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}
                        className="capitalize"
                      >
                        {l.status}
                      </Badge>
                    </td>
                    {!isEmployee && (
                      <td className="px-4 py-3 text-right">
                        {l.status === "pending" ? (
                          <div className="inline-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7"
                              onClick={() => setDecisionFor({ id: l.id, status: "approved" })}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7"
                              onClick={() => setDecisionFor({ id: l.id, status: "rejected" })}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {l.approved_by ? `By ${employeeName(employeeMap.get(l.approved_by))}` : "—"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {leaves.length === 0 && (
                <tr><td colSpan={isEmployee ? 5 : 7} className="text-center py-12 text-muted-foreground">No leave requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!decisionFor} onOpenChange={(o) => !o && setDecisionFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionFor?.status === "approved" ? "Approve leave" : "Reject leave"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {decisionFor?.status === "approved"
              ? "This will mark the leave request as approved."
              : "This will mark the leave request as rejected."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionFor(null)}>Cancel</Button>
            <Button onClick={submitDecision} disabled={updateStatus.isPending}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
