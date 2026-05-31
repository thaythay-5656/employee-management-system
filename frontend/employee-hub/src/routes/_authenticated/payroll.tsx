import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payroll")({
  component: PayrollPage,
});

function PayrollPage() {
  const user = useAuthStore((s) => s.user);
  const { employees } = useDataStore();
  const isEmployee = user?.role === "employee";
  const list = isEmployee
    ? employees.filter((e) => e.id === (user?.employeeId ?? employees[0].id))
    : employees;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My payslips" : "Payroll"}
        description={isEmployee ? "Your salary history." : "Monthly salary breakdown."}
      />
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                {!isEmployee && <th className="text-left px-4 py-3 font-medium">Employee</th>}
                <th className="text-left px-4 py-3 font-medium">Position</th>
                <th className="text-left px-4 py-3 font-medium">Base / Year</th>
                <th className="text-left px-4 py-3 font-medium">Monthly</th>
                <th className="text-left px-4 py-3 font-medium">Bonus</th>
                <th className="text-left px-4 py-3 font-medium">Net</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const monthly = e.salary / 12;
                const bonus = monthly * 0.1;
                const net = monthly + bonus - monthly * 0.18;
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                    {!isEmployee && <td className="px-4 py-3 font-medium">{e.fullName}</td>}
                    <td className="px-4 py-3 text-muted-foreground">{e.position}</td>
                    <td className="px-4 py-3">${e.salary.toLocaleString()}</td>
                    <td className="px-4 py-3">${monthly.toFixed(0)}</td>
                    <td className="px-4 py-3 text-accent">+${bonus.toFixed(0)}</td>
                    <td className="px-4 py-3 font-semibold">${net.toFixed(0)}</td>
                    <td className="px-4 py-3"><Badge variant="default">Paid</Badge></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => toast.success("Payslip downloaded")}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}