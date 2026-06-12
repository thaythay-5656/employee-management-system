// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import { Plus, Edit2, Trash2 } from "lucide-react";
// import { toast } from "sonner";
// import { PageHeader } from "@/components/layout/page-header";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from "@/components/ui/select";
// import { useDataStore } from "@/store/data-store";
// import { useAuthStore } from "@/store/auth-store";
// import type { Position } from "@/types";

// export const Route = createFileRoute("/_authenticated/positions")({
//   component: PositionsPage,
// });

// const GRADES: Position["grade"][] = ["Junior", "Mid", "Senior", "Lead", "Manager"];

// function PositionsPage() {
//   const { positions, departments, employees, addPosition, updatePosition, deletePosition, logAudit } = useDataStore();
//   const user = useAuthStore((s) => s.user);
//   const [open, setOpen] = useState(false);
//   const [editing, setEditing] = useState<Position | null>(null);
//   const [form, setForm] = useState<Omit<Position, "id">>({ title: "", department: departments[0]?.name ?? "", grade: "Mid", baseSalary: 60000 });

//   const onOpen = (p?: Position) => {
//     if (p) {
//       setEditing(p);
//       setForm({ title: p.title, department: p.department, grade: p.grade, baseSalary: p.baseSalary });
//     } else {
//       setEditing(null);
//       setForm({ title: "", department: departments[0]?.name ?? "", grade: "Mid", baseSalary: 60000 });
//     }
//     setOpen(true);
//   };

//   const onSave = () => {
//     if (!form.title) return toast.error("Title required");
//     if (editing) {
//       updatePosition(editing.id, form);
//       logAudit(user?.email ?? "system", "Updated position", form.title);
//       toast.success("Position updated");
//     } else {
//       addPosition(form);
//       logAudit(user?.email ?? "system", "Created position", form.title);
//       toast.success("Position added");
//     }
//     setOpen(false);
//   };

//   const countFor = (title: string) => employees.filter((e) => e.position === title).length;

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title="Positions"
//         description="Manage job titles, grades, and salary bands."
//         actions={
//           <Button onClick={() => onOpen()}><Plus className="h-4 w-4 mr-1" /> Add position</Button>
//         }
//       />
//       <div className="glass rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
//               <tr>
//                 <th className="text-left px-4 py-3 font-medium">Title</th>
//                 <th className="text-left px-4 py-3 font-medium">Department</th>
//                 <th className="text-left px-4 py-3 font-medium">Grade</th>
//                 <th className="text-left px-4 py-3 font-medium">Base salary</th>
//                 <th className="text-left px-4 py-3 font-medium">Employees</th>
//                 <th className="w-10"></th>
//               </tr>
//             </thead>
//             <tbody>
//               {positions.map((p) => (
//                 <tr key={p.id} className="border-t border-border hover:bg-muted/20">
//                   <td className="px-4 py-3 font-medium">{p.title}</td>
//                   <td className="px-4 py-3 text-muted-foreground">{p.department}</td>
//                   <td className="px-4 py-3"><Badge variant="secondary">{p.grade}</Badge></td>
//                   <td className="px-4 py-3">${p.baseSalary.toLocaleString()}</td>
//                   <td className="px-4 py-3">{countFor(p.title)}</td>
//                   <td className="px-2 py-3 text-right">
//                     <Button size="icon" variant="ghost" onClick={() => onOpen(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
//                     <Button size="icon" variant="ghost" className="text-destructive"
//                       onClick={() => { deletePosition(p.id); toast.success("Position removed"); }}>
//                       <Trash2 className="h-3.5 w-3.5" />
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//               {positions.length === 0 && (
//                 <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No positions yet.</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent>
//           <DialogHeader><DialogTitle>{editing ? "Edit position" : "Add position"}</DialogTitle></DialogHeader>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2 col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
//             <div className="space-y-2">
//               <Label>Department</Label>
//               <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
//                 <SelectTrigger><SelectValue /></SelectTrigger>
//                 <SelectContent>
//                   {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Grade</Label>
//               <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v as Position["grade"] })}>
//                 <SelectTrigger><SelectValue /></SelectTrigger>
//                 <SelectContent>
//                   {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2 col-span-2"><Label>Base salary (USD/year)</Label><Input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} /></div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
//             <Button onClick={onSave}>{editing ? "Save" : "Add"}</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePositions, usePositionMutations, useDepartments, useEmployees } from "@/hooks/useEMS";
import { useAuthStore } from "@/store/auth-store";
import type { Position } from "@/api/services";

export const Route = createFileRoute("/_authenticated/positions")({
  component: PositionsPage,
});

function PositionsPage() {
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === "admin";

  const { data: positions, loading, refetch } = usePositions();
  const { data: departments } = useDepartments();
  const { data: employees } = useEmployees();
  const { createPosition, updatePosition, deletePosition } = usePositionMutations(refetch);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<Omit<Position, "id">>({
    position_name: "",
    description: "",
  });

  const onOpen = (p?: Position) => {
    if (p) {
      setEditing(p);
      setForm({ position_name: p.position_name, description: p.description });
    } else {
      setEditing(null);
      setForm({ position_name: "", description: "" });
    }
    setOpen(true);
  };

  const onSave = async () => {
    if (!form.position_name) return toast.error("Position name required");
    try {
      if (editing) {
        await updatePosition(editing.id, form);
        toast.success("Position updated");
      } else {
        await createPosition(form);
        toast.success("Position added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save position");
    }
  };

  const onDelete = async (p: Position) => {
    try {
      await deletePosition(p.id);
      toast.success("Position removed");
    } catch {
      toast.error("Failed to delete position");
    }
  };

  // Count employees holding each position
  const countFor = (posId: number) =>
    employees.filter((e) => e.position === posId).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Positions" description="Manage job titles and roles." />
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Positions"
        description="Manage job titles and roles."
        actions={
          canMutate && (
            <Button onClick={() => onOpen()}>
              <Plus className="h-4 w-4 mr-1" /> Add position
            </Button>
          )
        }
      />

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Employees</th>
                {canMutate && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  {/* Django field: position_name */}
                  <td className="px-4 py-3 font-medium">{p.position_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.description || "—"}</td>
                  <td className="px-4 py-3">{countFor(p.id)}</td>
                  {canMutate && (
                    <td className="px-2 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => onOpen(p)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">
                    No positions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit position" : "Add position"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Position name</Label>
              <Input
                value={form.position_name}
                onChange={(e) => setForm({ ...form, position_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSave}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}