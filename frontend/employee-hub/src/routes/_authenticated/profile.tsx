import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { toast } from "sonner";

import { useEmployees, useUpdateEmployeeById } from "@/api/queries/useEmployees";
import { useDepartments } from "@/api/queries/useDepartments";
import { usePositions } from "@/api/queries/usePositions";
import type { Gender } from "@/types/api";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const DJANGO_BASE = "http://127.0.0.1:8000";

type FormState = {
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  address: string;
  gender: Gender;
  dateOfBirth: string;
  profilePicture: File | null;
  profilePicturePreview: string | null;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  password: "",
  phone: "",
  address: "",
  gender: "male",
  dateOfBirth: "",
  profilePicture: null,
  profilePicturePreview: null,
};

function ProfilePage() {
  const authUser = useAuthStore((s) => s.user);
  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const updateEmployee = useUpdateEmployeeById();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const me = employees.find((e) => e.user.username === authUser?.username);

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (me) {
      setForm({
        firstName: me.user.first_name,
        lastName: me.user.last_name,
        password: "",
        phone: me.phone,
        address: me.address,
        gender: me.gender,
        dateOfBirth: me.date_of_birth,
        profilePicture: null,
        profilePicturePreview: null,
      });
    }
  }, [me]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading profile…</div>;
  }

  if (!me) {
    return <div className="text-sm text-muted-foreground">Could not load your profile.</div>;
  }

  const fullName = `${me.user.first_name} ${me.user.last_name}`.trim() || me.user.username;
  const initials = fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const departmentName = departments.find((d) => d.id === me.department)?.department_name ?? "—";
  const positionName = positions.find((p) => p.id === me.position)?.position_name ?? "—";

  // Resolve the avatar URL:
  // 1. Local preview (just picked a new file)
  // 2. Django media URL (existing profile picture)
  // 3. Fallback to initials (AvatarFallback)
  const avatarSrc = (() => {
    if (form.profilePicturePreview) return form.profilePicturePreview;
    if (me.profile_picture) {
      // Django returns relative path like "profile_pictures/foo.jpg"
      // or full URL if MEDIA_URL is absolute — handle both
      return me.profile_picture.startsWith("http")
        ? me.profile_picture
        : `${DJANGO_BASE}/media/${me.profile_picture}`;
    }
    return undefined;
  })();

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, profilePicture: file, profilePicturePreview: preview }));
  };

  const onSave = () => {
    const payload: any = {
      user: {
        username: me.user.username,
        first_name: form.firstName,
        last_name: form.lastName,
        email: me.user.email,
        is_active: me.user.is_active,
        ...(form.password ? { password: form.password } : {}),
      },
      phone: form.phone,
      address: form.address,
      gender: form.gender,
      date_of_birth: form.dateOfBirth,
      ...(form.profilePicture ? { profile_picture: form.profilePicture } : {}),
    };

    updateEmployee.mutate(
      { id: me.id, data: payload },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          setForm((f) => ({ ...f, password: "", profilePicture: null, profilePicturePreview: null }));
        },
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="My profile" description="Update your personal information." />
      <div className="glass rounded-xl p-6">
        {/* Avatar + pick button */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarSrc} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90 transition"
              title="Change photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{fullName}</h2>
            <p className="text-sm text-muted-foreground">@{me.user.username}</p>
            {form.profilePicture && (
              <p className="text-xs text-primary mt-0.5">{form.profilePicture.name} — click Save to upload</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={me.user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>New password <span className="text-muted-foreground text-xs">(leave blank to keep)</span></Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as Gender })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={departmentName} disabled />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Input value={positionName} disabled />
          </div>
          <div className="space-y-2">
            <Label>Hire date</Label>
            <Input value={me.hire_date} disabled />
          </div>
          <div className="space-y-2">
            <Label>Salary</Label>
            <Input value={`$${Number(me.salary).toLocaleString()}`} disabled />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onSave} disabled={updateEmployee.isPending}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}