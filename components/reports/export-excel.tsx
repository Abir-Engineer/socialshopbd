"use client";

import type { ReportData } from "@/types/reports";

type ExportExcelProps = {
  data: ReportData;
};

export function ExportExcel({ data }: ExportExcelProps) {
  const handleExport = () => {
    const html = buildExcelHtml(data);
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.period}-report-${data.dateRange.from}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
    >
      Export Excel
    </button>
  );
}

function buildExcelHtml(data: ReportData): string {
  const rows = data.chart.map((p) => `
    <tr>
      <td>${p.label}</td>
      <td>${p.revenue}</td>
      <td>${p.profit}</td>
      <td>${p.expenses}</td>
      <td>${p.courierCost}</td>
      <td>${p.orders}</td>
    </tr>
  `).join("");

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>td{mso-number-format:"\\#\\,\\#\\#0";} th{font-weight:bold;background:#f0f0f0;}</style>
</head><body>
<table>
  <tr><th colspan="6">${data.period.charAt(0).toUpperCase() + data.period.slice(1)} Report (${data.dateRange.from} — ${data.dateRange.to})</th></tr>
  <tr><th>Period</th><th>Revenue</th><th>Profit</th><th>Expenses</th><th>Courier Cost</th><th>Orders</th></tr>
  ${rows}
</table></body></html>`;
}
