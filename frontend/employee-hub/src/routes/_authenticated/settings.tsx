import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/store/theme-store";
import { useDataStore } from "@/store/data-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const resetSeed = useDataStore((s) => s.resetSeed);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Manage workspace preferences." />
      <div className="glass rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Dark mode</Label>
            <p className="text-sm text-muted-foreground">Use the Midnight Indigo dark theme.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
        </div>
        <div className="border-t border-border pt-6">
          <Label className="text-base">Demo data</Label>
          <p className="text-sm text-muted-foreground mb-3">Reset all employees, leaves, and attendance back to seed.</p>
          <Button
            variant="outline"
            onClick={() => { resetSeed(); toast.success("Demo data reset"); }}
          >Reset demo data</Button>
        </div>
      </div>
    </div>
  );
}