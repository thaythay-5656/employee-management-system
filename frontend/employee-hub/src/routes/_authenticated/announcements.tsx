import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";

export const Route = createFileRoute("/_authenticated/announcements")({
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { announcements, addAnnouncement, removeAnnouncement } = useDataStore();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "hr";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);

  const sorted = [...announcements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Company news, HR notices, and updates."
        actions={
          canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> New announcement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create announcement</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Message</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                    Pin this announcement
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      if (!title || !body) return toast.error("Fill all fields");
                      addAnnouncement({ title, body, pinned, author: user?.email ?? "HR" });
                      setTitle(""); setBody(""); setPinned(false);
                      setOpen(false);
                      toast.success("Posted");
                    }}
                  >Post</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
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
            {a.pinned && (
              <Badge className="absolute top-3 right-3 gap-1" variant="default">
                <Pin className="h-3 w-3" /> Pinned
              </Badge>
            )}
            <h3 className="font-semibold pr-16">{a.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{a.body}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{a.author} · {new Date(a.createdAt).toLocaleDateString()}</span>
              {canManage && (
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => { removeAnnouncement(a.id); toast.success("Deleted"); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}