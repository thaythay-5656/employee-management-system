// import { createFileRoute } from "@tanstack/react-router";
// import { Download, Sparkles } from "lucide-react";
// import { useMemo, useState } from "react";
// import { PageHeader } from "@/components/layout/page-header";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useDataStore } from "@/store/data-store";
// import { useAuthStore } from "@/store/auth-store";
// import { toast } from "sonner";
// import { exportPayslipPDF, exportToExcel } from "@/lib/export";

// export const Route = createFileRoute("/_authenticated/payroll")({
//   component: PayrollPage,
// });

// function PayrollPage() {
//   const user = useAuthStore((s) => s.user);
//   const { employees, payrolls, generatePayroll, logAudit, addNotification } = useDataStore();
//   const isEmployee = user?.role === "employee";
//   const months = useMemo(() => Array.from(new Set(payrolls.map((p) => p.month))).sort().reverse(), [payrolls]);
//   const [month, setMonth] = useState(months[0] ?? "2026-05");
//   const records = payrolls.filter((p) => p.month === month);
//   const myId = user?.employeeId ?? employees[0]?.id;
//   const list = isEmployee ? payrolls.filter((p) => p.employeeId === myId) : records;

//   const company = "Nimbus HR";
//   const totalNet = records.reduce((s, p) => s + p.net, 0);

//   const downloadPayslip = (employeeId: string, m: string) => {
//     const p = payrolls.find((x) => x.employeeId === employeeId && x.month === m);
//     const e = employees.find((x) => x.id === employeeId);
//     if (!p || !e) return;
//     exportPayslipPDF({
//       company,
//       employeeName: e.fullName,
//       employeeId: e.id,
//       position: e.position,
//       department: e.department,
//       month: m,
//       base: p.base, bonus: p.bonus, tax: p.tax, deductions: p.deductions, net: p.net,
//     });
//     toast.success("Payslip downloaded");
//   };

//   const onGenerate = () => {
//     const m = month;
//     generatePayroll(m);
//     logAudit(user?.email ?? "system", "Generated payroll", m);
//     addNotification({ title: "Payroll generated", body: `${m} payroll is ready.`, forRole: "admin" });
//     toast.success(`Payroll generated for ${m}`);
//   };

//   const exportSheet = () => {
//     exportToExcel(
//       list.map((p) => {
//         const e = employees.find((x) => x.id === p.employeeId);
//         return {
//           Employee: e?.fullName ?? "—", Month: p.month,
//           Base: p.base.toFixed(2), Bonus: p.bonus.toFixed(2),
//           Tax: p.tax.toFixed(2), Deductions: p.deductions.toFixed(2), Net: p.net.toFixed(2),
//           Status: p.status,
//         };
//       }),
//       `payroll-${month}`,
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title={isEmployee ? "My payslips" : "Payroll"}
//         description={isEmployee ? "Your salary history." : "Monthly salary breakdown."}
//         actions={!isEmployee && (
//           <div className="flex gap-2">
//             <Select value={month} onValueChange={setMonth}>
//               <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
//               <SelectContent>
//                 {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
//               </SelectContent>
//             </Select>
//             <Button size="sm" variant="outline" onClick={exportSheet}><Download className="h-3.5 w-3.5 mr-1" /> Excel</Button>
//             <Button size="sm" onClick={onGenerate}><Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerate</Button>
//           </div>
//         )}
//       />
//       {!isEmployee && (
//         <div className="glass rounded-xl p-4 flex items-center justify-between">
//           <div className="text-sm text-muted-foreground">Total net for {month}</div>
//           <div className="text-2xl font-semibold">${totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
//         </div>
//       )}
//       <div className="glass rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
//               <tr>
//                 {!isEmployee && <th className="text-left px-4 py-3 font-medium">Employee</th>}
//                 <th className="text-left px-4 py-3 font-medium">Month</th>
//                 <th className="text-left px-4 py-3 font-medium">Base</th>
//                 <th className="text-left px-4 py-3 font-medium">Bonus</th>
//                 <th className="text-left px-4 py-3 font-medium">Tax</th>
//                 <th className="text-left px-4 py-3 font-medium">Deductions</th>
//                 <th className="text-left px-4 py-3 font-medium">Net</th>
//                 <th className="text-left px-4 py-3 font-medium">Status</th>
//                 <th></th>
//               </tr>
//             </thead>
//             <tbody>
//               {list.map((p) => {
//                 const e = employees.find((x) => x.id === p.employeeId);
//                 return (
//                   <tr key={p.id} className="border-t border-border hover:bg-muted/20">
//                     {!isEmployee && <td className="px-4 py-3 font-medium">{e?.fullName ?? "—"}</td>}
//                     <td className="px-4 py-3 text-muted-foreground">{p.month}</td>
//                     <td className="px-4 py-3">${p.base.toFixed(0)}</td>
//                     <td className="px-4 py-3 text-accent">+${p.bonus.toFixed(0)}</td>
//                     <td className="px-4 py-3 text-destructive">-${p.tax.toFixed(0)}</td>
//                     <td className="px-4 py-3 text-destructive">-${p.deductions.toFixed(0)}</td>
//                     <td className="px-4 py-3 font-semibold">${p.net.toFixed(0)}</td>
//                     <td className="px-4 py-3"><Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge></td>
//                     <td className="px-4 py-3">
//                       <Button size="sm" variant="ghost" onClick={() => downloadPayslip(p.employeeId, p.month)}>
//                         <Download className="h-3.5 w-3.5" />
//                       </Button>
//                     </td>
//                   </tr>
//                 );
//               })}
//               {list.length === 0 && (
//                 <tr><td colSpan={isEmployee ? 8 : 9} className="text-center py-12 text-muted-foreground">No payroll records.</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/export";
import { usePayroll, useEmployees } from "@/hooks/useEMS";

export const Route = createFileRoute("/_authenticated/payroll")({
  component: PayrollPage,
});

function PayrollPage() {
  const user = useAuthStore((s) => s.user);
  const isEmployee = user?.role === "employee";

  const { data: payrolls, loading } = usePayroll();
  const { data: employees } = useEmployees();

  // Django field: pay_date (e.g. "2026-05-31") — derive month from it
  const months = useMemo(
    () =>
      Array.from(new Set(payrolls.map((p) => p.pay_date.slice(0, 7))))
        .sort()
        .reverse(),
    [payrolls]
  );
  const [month, setMonth] = useState(months[0] ?? "");

  // Filter by selected month and role
  const myId = user?.employeeId;
  const list = isEmployee
    ? payrolls.filter((p) => p.employee === myId)
    : payrolls.filter((p) => p.pay_date.startsWith(month));

  const getEmployeeName = (empId: number) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? `${emp.user.first_name} ${emp.user.last_name}` : "—";
  };

  // Totals for the selected month (admin/manager view)
  const totalBasic = list.reduce((s, p) => s + parseFloat(p.basic_salary), 0);
  const totalBonus = list.reduce((s, p) => s + parseFloat(p.bonus), 0);
  const totalDeductions = list.reduce((s, p) => s + parseFloat(p.deduction), 0);
  const totalNet = list.reduce((s, p) => s + parseFloat(p.total_salary), 0);

  const exportSheet = () => {
    exportToExcel(
      list.map((p) => ({
        Employee: getEmployeeName(p.employee),
        "Pay Date": p.pay_date,
        "Basic Salary": parseFloat(p.basic_salary).toFixed(2),
        Bonus: parseFloat(p.bonus).toFixed(2),
        Deduction: parseFloat(p.deduction).toFixed(2),
        "Total Salary": parseFloat(p.total_salary).toFixed(2),
      })),
      `payroll-${month}`
    );
    toast.success("Exported to Excel");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payroll" description="Monthly salary breakdown." />
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "My payslips" : "Payroll"}
        description={isEmployee ? "Your salary history." : "Monthly salary breakdown."}
        actions={
          !isEmployee && (
            <div className="flex gap-2">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={exportSheet}>
                <Download className="h-3.5 w-3.5 mr-1" /> Excel
              </Button>
            </div>
          )
        }
      />

      {!isEmployee && (
        <div className="glass rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Basic</div>
            <div className="font-semibold">${totalBasic.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Bonus</div>
            <div className="font-semibold text-accent">+${totalBonus.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Deductions</div>
            <div className="font-semibold text-destructive">-${totalDeductions.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net total</div>
            <div className="text-2xl font-semibold">${totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
              <tr>
                {!isEmployee && (
                  <th className="text-left px-4 py-3 font-medium">Employee</th>
                )}
                {/* Django field: pay_date */}
                <th className="text-left px-4 py-3 font-medium">Pay date</th>
                {/* Django field: basic_salary */}
                <th className="text-left px-4 py-3 font-medium">Basic</th>
                <th className="text-left px-4 py-3 font-medium">Bonus</th>
                {/* Django field: deduction */}
                <th className="text-left px-4 py-3 font-medium">Deduction</th>
                {/* Django field: total_salary */}
                <th className="text-left px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  {!isEmployee && (
                    <td className="px-4 py-3 font-medium">
                      {getEmployeeName(p.employee)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-muted-foreground">{p.pay_date}</td>
                  <td className="px-4 py-3">
                    ${parseFloat(p.basic_salary).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-accent">
                    +${parseFloat(p.bonus).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-destructive">
                    -${parseFloat(p.deduction).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ${parseFloat(p.total_salary).toFixed(0)}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={isEmployee ? 5 : 6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No payroll records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}