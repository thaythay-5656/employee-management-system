import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exports an array of plain objects to an .xlsx file.
 * Each object's keys become column headers.
 *
 * @param rows - array of row objects, e.g. [{ Name: "Alice", Salary: 50000 }]
 * @param filename - file name without extension, e.g. "employees"
 */
export function exportToExcel(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) {
    rows = [{}];
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exports a table (headers + rows) to a PDF file with a title.
 *
 * @param title - heading printed at the top of the PDF
 * @param headers - column header labels
 * @param rows - 2D array of cell values (strings/numbers), one array per row
 * @param filename - file name without extension, e.g. "employees"
 */
export function exportTableToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(title, 14, 16);

  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map((cell) => String(cell))),
    startY: 22,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] }, // indigo-ish header
  });

  doc.save(`${filename}.pdf`);
}