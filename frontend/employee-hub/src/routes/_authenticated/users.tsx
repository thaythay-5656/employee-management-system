import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, KeyRound, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types";

export const Route = createFileRoute("/_authenticated/users")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      // FIX: correct localStorage key to match auth store
      const raw = localStorage.getItem("nimbus-auth-storage");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.state?.user?.role !== "admin") throw redirect({ to: "/dashboard" });
    } catch (e) {
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
    }
  },
  component: UsersPage,
});

// FIX: removed "hr" — not a valid Django role
const ROLES: Role[] = ["admin", "manager", "employee"];

function UsersPage() {
  const { users, addUser, updateUser, deleteUser, logAudit } = useDataStore();
  const me = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "employee" as Role });
  const [pwOpen, setPwOpen] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");

  const onCreate = () => {
    if (!form.email || !form.password) return toast.error("Email & password required");
    addUser({ email: form.email, password: form.password, role: form.role });
    logAudit(me?.email ?? "system", "Created user", form.email);
    toast.success("User created");
    setForm({ email: "", password: "", role: "employee" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage system accounts, roles, and permissions."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New user</Button>}
      />
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">
                    <Select value={u.role} onValueChange={(v) => {
                      updateUser(u.id, { role: v as Role });
                      logAudit(me?.email ?? "system", "Changed role", `${u.email} → ${v}`);
                    }}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.password ? "default" : "outline"} className="capitalize">
                      {u.password ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => { setPwOpen(u.id); setNewPw(""); }}>
                      <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => {
                        updateUser(u.id, { password: u.password ? "" : "demo1234" });
                        toast.success(u.password ? "Deactivated" : "Activated");
                      }}>
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive"
                      onClick={() => { deleteUser(u.id); toast.success("User deleted"); }}
                      // FIX: compare by username since mock user ids don't match Django's numeric id
                      disabled={u.email === me?.email}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwOpen} onOpenChange={(o) => !o && setPwOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>New password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!pwOpen || !newPw) return;
              updateUser(pwOpen, { password: newPw });
              logAudit(me?.email ?? "system", "Reset password", pwOpen);
              toast.success("Password reset");
              setPwOpen(null);
            }}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
