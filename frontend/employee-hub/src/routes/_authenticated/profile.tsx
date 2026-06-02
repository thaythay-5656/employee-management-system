import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { employees, updateEmployee } = useDataStore();
  const me = employees.find((e) => e.id === user?.employeeId) ?? employees[0];
  const [fn, ...rest] = (me.fullName ?? "").split(" ");
  const [form, setForm] = useState({
    firstName: me.firstName ?? fn ?? "",
    lastName: me.lastName ?? rest.join(" "),
    password: me.password ?? "",
    gender: me.gender,
    dateOfBirth: me.dateOfBirth,
    phone: me.phone,
    address: me.address,
  });

  const onSave = () => {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    updateEmployee(me.id, { ...form, fullName });
    toast.success("Profile updated");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="My profile" description="Update your personal information." />
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
              {me.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{me.fullName}</h2>
            <p className="text-sm text-muted-foreground">@{me.username ?? me.email.split("@")[0]}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
          <div className="space-y-2"><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={me.email} disabled /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Date of birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="space-y-2"><Label>Position</Label><Input value={me.position} disabled /></div>
          <div className="space-y-2"><Label>Join date</Label><Input value={me.joinDate} disabled /></div>
          <div className="space-y-2"><Label>Salary</Label><Input value={`$${me.salary.toLocaleString()}`} disabled /></div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onSave}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}