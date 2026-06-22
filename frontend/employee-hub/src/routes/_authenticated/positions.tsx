import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth-store";
import {
  usePositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
} from "@/api/queries/usePositions";
import { useEmployees } from "@/api/queries/useEmployees";
import type { Position } from "@/types/api";

export const Route = createFileRoute("/_authenticated/positions")({
  component: PositionsPage,
});

type FormState = { position_name: string; description: string };

const emptyForm: FormState = { position_name: "", description: "" };

function PositionsPage() {
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === "admin";

  const { data: positions = [], isLoading } = usePositions();
  const { data: employees = [] } = useEmployees();

  const createPosition = useCreatePosition();
  const deletePosition = useDeletePosition();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Single "update by id" hook — only fires when editing is set and save is clicked.
  const updatePosition = useUpdatePosition(editing?.id ?? 0);

  const onOpen = (p?: Position) => {
    if (p) {
      setEditing(p);
      setForm({ position_name: p.position_name, description: p.description });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const onSave = () => {
    if (!form.position_name.trim()) {
      toast.error("Title required");
      return;
    }

    if (editing) {
      updatePosition.mutate(form, {
        onSuccess: () => {
          toast.success("Position updated");
          setOpen(false);
        },
        onError: () => toast.error("Failed to update position"),
      });
    } else {
      createPosition.mutate(form, {
        onSuccess: () => {
          toast.success("Position added");
          setOpen(false);
        },
        onError: () => toast.error("Failed to create position"),
      });
    }
  };

  const handleDelete = (p: Position) => {
    deletePosition.mutate(p.id, {
      onSuccess: () => toast.success("Position removed"),
      onError: () => toast.error("Failed to delete position. It may still be assigned to employees."),
    });
  };

  const countFor = (positionId: number) => employees.filter((e) => e.position === positionId).length;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading positions…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Positions"
        description="Manage job titles and descriptions."
        actions={
          canMutate ? (
            <Button onClick={() => onOpen()}><Plus className="h-4 w-4 mr-1" /> Add position</Button>
          ) : undefined
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
                {canMutate && <th className="w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{p.position_name}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md truncate">{p.description}</td>
                  <td className="px-4 py-3">{countFor(p.id)}</td>
                  {canMutate && (
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => onOpen(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {positions.length === 0 && (
                <tr><td colSpan={canMutate ? 4 : 3} className="text-center py-12 text-muted-foreground">No positions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit position" : "Add position"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.position_name}
                onChange={(e) => setForm({ ...form, position_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={createPosition.isPending || updatePosition.isPending}>
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
