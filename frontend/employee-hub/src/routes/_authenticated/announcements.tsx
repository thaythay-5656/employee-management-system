import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth-store";

import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "@/api/queries/useAnnouncements";
import type { Announcement } from "@/types/api";

export const Route = createFileRoute("/_authenticated/announcements")({
  component: AnnouncementsPage,
});

type FormState = { title: string; content: string };
const emptyForm: FormState = { title: "", content: "" };

function AnnouncementsPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "manager";

  // NOTE: AnnouncementViewSet currently requires IsManagerOrAdmin for ALL
  // actions, including list/retrieve. If you haven't relaxed this on the
  // backend yet, employees will get a 403 here.
  const { data: announcements = [], isLoading, isError } = useAnnouncements();

  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const updateAnnouncement = useUpdateAnnouncement(editing?.id ?? 0);

  const sorted = [...announcements].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEditing(null);
      setForm(emptyForm);
    }
  };

  const onAddNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const onEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content });
    setOpen(true);
  };

  const onSave = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Fill all fields");
      return;
    }

    if (editing) {
      updateAnnouncement.mutate(form, {
        onSuccess: () => {
          toast.success("Announcement updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update announcement"),
      });
    } else {
      createAnnouncement.mutate(form, {
        onSuccess: () => {
          toast.success("Posted");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to post announcement"),
      });
    }
  };

  const handleDelete = (a: Announcement) => {
    deleteAnnouncement.mutate(a.id, {
      onSuccess: () => toast.success("Deleted"),
      onError: () => toast.error("Failed to delete announcement"),
    });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading announcements…</div>;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Announcements" description="Company news, HR notices, and updates." />
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
          You don't have access to announcements yet. Contact an admin if this seems wrong.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Company news, HR notices, and updates."
        actions={
          canManage ? (
            <Dialog open={open} onOpenChange={onOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={onAddNew}><Plus className="h-4 w-4 mr-1" /> New announcement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Edit announcement" : "Create announcement"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button onClick={onSave} disabled={createAnnouncement.isPending || updateAnnouncement.isPending}>
                    {editing ? "Save changes" : "Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass rounded-xl p-5 relative"
          >
            <h3 className="font-semibold pr-16">{a.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{a.content}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(a.created_at).toLocaleDateString()}</span>
              {canManage && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(a)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(a)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {sorted.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full text-center py-12">No announcements yet.</div>
        )}
      </div>
    </div>
  );
}
