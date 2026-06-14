import { createFileRoute } from "@tanstack/react-router";
import { Download, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { exportPayslipPDF, exportToExcel } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/payroll")({
  component: PayrollPage,
});

function PayrollPage() {
  const user = useAuthStore((s) => s.user);
  const { employees, payrolls, generatePayroll, logAudit, addNotification } = useDataStore();
  const isEmployee = user?.role === "employee";
  const months = useMemo(() => Array.from(new Set(payrolls.map((p) => p.month))).sort().reverse(), [payrolls]);
  const [month, setMonth] = useState(months[0] ?? "2026-05");
  const records = payrolls.filter((p) => p.month === month);
  const me = employees.find((e) => e.username === user?.username);
  const myId = me?.id ?? employees[0]?.id;
  const list = isEmployee ? payrolls.filter((p) => p.employeeId === myId) : records;

  const company = "Nimbus HR";
  const totalNet = records.reduce((s, p) => s + p.net, 0);

  const downloadPayslip = (employeeId: string, m: string) => {
    const p = payrolls.find((x) => x.employeeId === employeeId && x.month === m);
    const e = employees.find((x) => x.id === employeeId);
    if (!p || !e) return;
    exportPayslipPDF({
      company,
      employeeName: e.fullName,
      employeeId: e.id,
      position: e.position,
      department: e.department,
      month: m,
      base: p.base, bonus: p.bonus, tax: p.tax, deductions: p.deductions, net: p.net,
    });
    toast.success("Payslip downloaded");
  };

  const onGenerate = () => {
    const m = month;
    generatePayroll(m);
    logAudit(user?.email ?? "system", "Generated payroll", m);
    addNotification({ title: "Payroll generated", body: `${m} payroll is ready.`, forRole: "admin" });
    toast.success(`Payroll generated for ${m}`);
  };

  const exportSheet = () => {
    exportToExcel(
      list.map((p) => {
        const e = employees.find((x) => x.id === p.employeeId);
        return {
          Employee: e?.fullName ?? "—", Month: p.month,
          Base: p.base.toFixed(2), Bonus: p.bonus.toFixed(2),
          Tax: p.tax.toFixed(2), Deductions: p.deductions.toFixed(2), Net: p.net.toFixed(2),
          Status: p.status,
        };
      }),
      `payroll-${month}`,
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My payslips" : "Payroll"}
        description={isEmployee ? "Your salary history." : "Monthly salary breakdown."}
        actions={!isEmployee && (
          <div className="flex gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={exportSheet}><Download className="h-3.5 w-3.5 mr-1" /> Excel</Button>
            <Button size="sm" onClick={onGenerate}><Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerate</Button>
          </div>
        )}
      />
      {!isEmployee && (
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Total net for {month}</div>
          <div className="text-2xl font-semibold">${totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      )}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                {!isEmployee && <th className="text-left px-4 py-3 font-medium">Employee</th>}
                <th className="text-left px-4 py-3 font-medium">Month</th>
                <th className="text-left px-4 py-3 font-medium">Base</th>
                <th className="text-left px-4 py-3 font-medium">Bonus</th>
                <th className="text-left px-4 py-3 font-medium">Tax</th>
                <th className="text-left px-4 py-3 font-medium">Deductions</th>
                <th className="text-left px-4 py-3 font-medium">Net</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const e = employees.find((x) => x.id === p.employeeId);
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                    {!isEmployee && <td className="px-4 py-3 font-medium">{e?.fullName ?? "—"}</td>}
                    <td className="px-4 py-3 text-muted-foreground">{p.month}</td>
                    <td className="px-4 py-3">${p.base.toFixed(0)}</td>
                    <td className="px-4 py-3 text-accent">+${p.bonus.toFixed(0)}</td>
                    <td className="px-4 py-3 text-destructive">-${p.tax.toFixed(0)}</td>
                    <td className="px-4 py-3 text-destructive">-${p.deductions.toFixed(0)}</td>
                    <td className="px-4 py-3 font-semibold">${p.net.toFixed(0)}</td>
                    <td className="px-4 py-3"><Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => downloadPayslip(p.employeeId, p.month)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={isEmployee ? 8 : 9} className="text-center py-12 text-muted-foreground">No payroll records.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}