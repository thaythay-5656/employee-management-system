// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import { Plus, Check, X, MessageSquare, XCircle } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";
// import { PageHeader } from "@/components/layout/page-header";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useDataStore } from "@/store/data-store";
// import { useAuthStore } from "@/store/auth-store";
// import { Textarea as Ta } from "@/components/ui/textarea";

// export const Route = createFileRoute("/_authenticated/leave")({
//   component: LeavePage,
// });

// const schema = z.object({
//   type: z.enum(["vacation", "sick", "emergency", "unpaid"]),
//   startDate: z.string().min(1),
//   endDate: z.string().min(1),
//   reason: z.string().min(3),
// });
// type FormValues = z.infer<typeof schema>;

// function LeavePage() {
//   const user = useAuthStore((s) => s.user);
//   const { leaves, employees, addLeave, updateLeaveStatus, cancelLeave, logAudit, addNotification } = useDataStore();
//   const isEmployee = user?.role === "employee";
//   const isManager = user?.role === "manager";
//   const me = employees.find((e) => e.id === user?.employeeId);
//   const myId = user?.employeeId ?? employees[0].id;
//   let list = leaves;
//   if (isEmployee) list = leaves.filter((l) => l.employeeId === myId);
//   else if (isManager && me) {
//     const teamIds = new Set(employees.filter((e) => e.department === me.department).map((e) => e.id));
//     list = leaves.filter((l) => teamIds.has(l.employeeId));
//   }

//   const [open, setOpen] = useState(false);
//   const [commentFor, setCommentFor] = useState<string | null>(null);
//   const [comment, setComment] = useState("");
//   const [pendingStatus, setPendingStatus] = useState<"approved" | "rejected">("approved");
//   const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "vacation" } });

//   const onSubmit = (v: FormValues) => {
//     addLeave({ ...v, employeeId: myId });
//     addNotification({ title: "New leave request", body: `${me?.fullName ?? "Employee"} requested ${v.type} leave.`, forRole: "admin" });
//     logAudit(user?.email ?? "system", "Submitted leave request", v.type);
//     toast.success("Leave request submitted");
//     setOpen(false);
//     form.reset();
//   };

//   const submitDecision = () => {
//     if (!commentFor) return;
//     updateLeaveStatus(commentFor, pendingStatus, comment || undefined, user?.email);
//     logAudit(user?.email ?? "system", pendingStatus === "approved" ? "Approved leave" : "Rejected leave", commentFor);
//     pendingStatus === "approved" ? toast.success("Approved") : toast.error("Rejected");
//     setCommentFor(null);
//     setComment("");
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title={isEmployee ? "My leave requests" : "Leave management"}
//         description={isEmployee ? "Track your time off and submit new requests." : "Review and approve leave requests."}
//         actions={
//           isEmployee && (
//             <Dialog open={open} onOpenChange={setOpen}>
//               <DialogTrigger asChild>
//                 <Button><Plus className="h-4 w-4 mr-1" /> Request leave</Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader><DialogTitle>New leave request</DialogTitle></DialogHeader>
//                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                   <div className="space-y-2">
//                     <Label>Type</Label>
//                     <Select defaultValue="vacation" onValueChange={(v) => form.setValue("type", v as FormValues["type"])}>
//                       <SelectTrigger><SelectValue /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="vacation">Vacation</SelectItem>
//                         <SelectItem value="sick">Sick</SelectItem>
//                         <SelectItem value="emergency">Emergency</SelectItem>
//                         <SelectItem value="unpaid">Unpaid</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="grid grid-cols-2 gap-3">
//                     <div className="space-y-2"><Label>Start date</Label><Input type="date" {...form.register("startDate")} /></div>
//                     <div className="space-y-2"><Label>End date</Label><Input type="date" {...form.register("endDate")} /></div>
//                   </div>
//                   <div className="space-y-2">
//                     <Label>Reason</Label>
//                     <Textarea rows={3} {...form.register("reason")} />
//                   </div>
//                   <DialogFooter>
//                     <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
//                     <Button type="submit">Submit</Button>
//                   </DialogFooter>
//                 </form>
//               </DialogContent>
//             </Dialog>
//           )
//         }
//       />
//       <div className="glass rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
//               <tr>
//                 {!isEmployee && <th className="text-left px-4 py-3 font-medium">Employee</th>}
//                 <th className="text-left px-4 py-3 font-medium">Type</th>
//                 <th className="text-left px-4 py-3 font-medium">From</th>
//                 <th className="text-left px-4 py-3 font-medium">To</th>
//                 <th className="text-left px-4 py-3 font-medium">Reason</th>
//                 <th className="text-left px-4 py-3 font-medium">Status</th>
//                 {!isEmployee && <th className="text-right px-4 py-3 font-medium">Actions</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {list.map((l) => {
//                 const emp = employees.find((e) => e.id === l.employeeId);
//                 return (
//                   <tr key={l.id} className="border-t border-border hover:bg-muted/20">
//                     {!isEmployee && <td className="px-4 py-3 font-medium">{emp?.fullName ?? "—"}</td>}
//                     <td className="px-4 py-3 capitalize text-muted-foreground">{l.type}</td>
//                     <td className="px-4 py-3 text-muted-foreground">{l.startDate}</td>
//                     <td className="px-4 py-3 text-muted-foreground">{l.endDate}</td>
//                     <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{l.reason}</td>
//                     <td className="px-4 py-3">
//                       <Badge
//                         variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}
//                         className="capitalize"
//                       >
//                         {l.status}
//                       </Badge>
//                     </td>
//                     {!isEmployee && (
//                       <td className="px-4 py-3 text-right">
//                         {l.status === "pending" ? (
//                           <div className="inline-flex gap-1">
//                             <Button size="sm" variant="outline" className="h-7"
//                               onClick={() => { setCommentFor(l.id); setPendingStatus("approved"); setComment(""); }}>
//                               <Check className="h-3.5 w-3.5" />
//                             </Button>
//                             <Button size="sm" variant="outline" className="h-7"
//                               onClick={() => { setCommentFor(l.id); setPendingStatus("rejected"); setComment(""); }}>
//                               <X className="h-3.5 w-3.5" />
//                             </Button>
//                           </div>
//                         ) : (
//                           <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
//                             {l.comment && <MessageSquare className="h-3 w-3" />} {l.approvedBy ?? "—"}
//                           </span>
//                         )}
//                       </td>
//                     )}
//                     {isEmployee && (
//                       <></>
//                     )}
//                   </tr>
//                 );
//               })}
//               {list.length === 0 && (
//                 <tr><td colSpan={isEmployee ? 5 : 7} className="text-center py-12 text-muted-foreground">No leave requests yet.</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//       {isEmployee && (
//         <div className="text-xs text-muted-foreground">
//           Tip: pending requests can be cancelled. <Button variant="link" className="h-auto p-0 text-xs"
//             onClick={() => {
//               const pending = list.find((l) => l.status === "pending");
//               if (pending) { cancelLeave(pending.id); toast.success("Cancelled"); }
//               else toast("No pending request");
//             }}>
//             <XCircle className="h-3 w-3 mr-1" /> Cancel last pending
//           </Button>
//         </div>
//       )}

//       <Dialog open={!!commentFor} onOpenChange={(o) => !o && setCommentFor(null)}>
//         <DialogContent>
//           <DialogHeader><DialogTitle>{pendingStatus === "approved" ? "Approve leave" : "Reject leave"}</DialogTitle></DialogHeader>
//           <div className="space-y-2">
//             <Label>Comment (optional)</Label>
//             <Ta rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setCommentFor(null)}>Cancel</Button>
//             <Button onClick={submitDecision}>Confirm</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLeaves, useLeaveMutations, useEmployees } from "@/hooks/useEMS";
import { useAuthStore } from "@/store/auth-store";
import type { Leave } from "@/api/services";

export const Route = createFileRoute("/_authenticated/leave")({
  component: LeavePage,
});

const schema = z.object({
  // Django leave_type values: "annual" | "sick" | "maternity" | "emergency" | "unpaid" | "other"
  leave_type: z.enum(["annual", "sick", "maternity", "emergency", "unpaid", "other"]),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  reason: z.string().min(3, "Reason too short"),
});
type FormValues = z.infer<typeof schema>;

function LeavePage() {
  const user = useAuthStore((s) => s.user);
  const isEmployee = user?.role === "employee";
  const isManager = user?.role === "manager";

  const { data: leaves, loading, refetch } = useLeaves();
  const { data: employees } = useEmployees();
  const { createLeave, approveLeave, rejectLeave } = useLeaveMutations(refetch);

  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leave_type: "annual" },
  });

  // Filter leave list by role
  const list: Leave[] = (() => {
    if (isEmployee) {
      // Show only this employee's leaves (match by employee FK = their employee id)
      return leaves.filter((l) => l.employee === user?.employeeId);
    }
    if (isManager) {
      // Show leaves for employees in the manager's department
      const me = employees.find((e) => e.id === user?.employeeId);
      if (!me) return leaves;
      const teamIds = new Set(
        employees.filter((e) => e.department === me.department).map((e) => e.id)
      );
      return leaves.filter((l) => teamIds.has(l.employee));
    }
    return leaves; // admin sees all
  })();

  const getEmployeeName = (employeeId: number) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.user.first_name} ${emp.user.last_name}` : "—";
  };

  const onSubmit = async (v: FormValues) => {
    if (!user?.employeeId) return toast.error("No employee profile linked to your account");
    try {
      await createLeave({
        employee: user.employeeId,
        leave_type: v.leave_type,
        start_date: v.start_date,
        end_date: v.end_date,
        reason: v.reason,
      });
      toast.success("Leave request submitted");
      setOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to submit leave request");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveLeave(id);
      toast.success("Leave approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectLeave(id);
      toast.error("Leave rejected");
    } catch {
      toast.error("Failed to reject");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leave" description="Leave management." />
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My leave requests" : "Leave management"}
        description={
          isEmployee
            ? "Track your time off and submit new requests."
            : "Review and approve leave requests."
        }
        actions={
          isEmployee && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> Request leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New leave request</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      defaultValue="annual"
                      onValueChange={(v) =>
                        form.setValue("leave_type", v as FormValues["leave_type"])
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="sick">Sick</SelectItem>
                        <SelectItem value="maternity">Maternity</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start date</Label>
                      <Input type="date" {...form.register("start_date")} />
                    </div>
                    <div className="space-y-2">
                      <Label>End date</Label>
                      <Input type="date" {...form.register("end_date")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea rows={3} {...form.register("reason")} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Submitting…" : "Submit"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                {!isEmployee && (
                  <th className="text-left px-4 py-3 font-medium">Employee</th>
                )}
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">From</th>
                <th className="text-left px-4 py-3 font-medium">To</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                {!isEmployee && (
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/20">
                  {!isEmployee && (
                    <td className="px-4 py-3 font-medium">
                      {getEmployeeName(l.employee)}
                    </td>
                  )}
                  {/* Django field: leave_type */}
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {l.leave_type}
                  </td>
                  {/* Django fields: start_date, end_date */}
                  <td className="px-4 py-3 text-muted-foreground">{l.start_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.end_date}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {l.reason}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        l.status === "approved"
                          ? "default"
                          : l.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
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
                            onClick={() => handleApprove(l.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() => handleReject(l.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {l.approved_by ? `By #${l.approved_by}` : "—"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={isEmployee ? 5 : 7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No leave requests yet.
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