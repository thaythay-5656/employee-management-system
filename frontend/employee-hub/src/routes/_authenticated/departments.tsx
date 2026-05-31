import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useDataStore } from "@/store/data-store";

export const Route = createFileRoute("/_authenticated/departments")({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const { departments, employees } = useDataStore();
  return (
    <div className="space-y-6">
      <PageHeader title="Departments" description="Teams and the people in them." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => {
          const team = employees.filter((e) => e.department === d.name);
          const manager = employees.find((e) => e.id === d.managerId);
          return (
            <div key={d.id} className="glass rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.description}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /> {team.length} members
                </span>
                <span className="text-xs text-muted-foreground">Manager: {manager?.fullName ?? "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}