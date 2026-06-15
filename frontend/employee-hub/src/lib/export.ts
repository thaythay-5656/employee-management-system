import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToExcel(rows: Record<string, unknown>[], filename: string, sheet = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportTableToPDF(title: string, columns: string[], rows: (string | number)[][], filename: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 28,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229] },
    theme: "striped",
  });
  doc.save(`${filename}.pdf`);
}

export interface PayslipInput {
  company: string;
  employeeName: string;
  employeeId: string;
  position: string;
  department: string;
  month: string;
  base: number;
  bonus: number;
  tax: number;
  deductions: number;
  net: number;
}

export function exportPayslipPDF(p: PayslipInput) {
  const doc = new jsPDF();
  doc.setFillColor(31, 27, 61);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.text(p.company, 14, 14);
  doc.setFontSize(11);
  doc.text("Payslip", 14, 22);
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(`Employee: ${p.employeeName}`, 14, 44);
  doc.text(`Employee ID: ${p.employeeId}`, 14, 52);
  doc.text(`Position: ${p.position}`, 14, 60);
  doc.text(`Department: ${p.department}`, 14, 68);
  doc.text(`Pay Period: ${p.month}`, 130, 44);
  doc.text(`Issued: ${new Date().toLocaleDateString()}`, 130, 52);
  autoTable(doc, {
    startY: 80,
    head: [["Description", "Amount (USD)"]],
    body: [
      ["Base Salary", `$${p.base.toFixed(2)}`],
      ["Bonus", `$${p.bonus.toFixed(2)}`],
      ["Tax", `-$${p.tax.toFixed(2)}`],
      ["Deductions", `-$${p.deductions.toFixed(2)}`],
    ],
    headStyles: { fillColor: [79, 70, 229] },
  });
  // @ts-expect-error jsPDF autoTable adds lastAutoTable
  const y = (doc.lastAutoTable?.finalY ?? 120) + 10;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Net Pay: $${p.net.toFixed(2)}`, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("This is a system-generated payslip.", 14, y + 10);
  doc.save(`payslip-${p.employeeId}-${p.month}.pdf`);
}
