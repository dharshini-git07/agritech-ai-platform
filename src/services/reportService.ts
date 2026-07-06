export const ReportService = {
  exportToCSV(headers: string[], rows: any[][], filename: string): void {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          const str = String(val === null || val === undefined ? "" : val);
          // Escape quotes and wrap containing commas/quotes
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportToExcel(headers: string[], rows: any[][], filename: string): void {
    // Excel reads Tab-Separated Values (TSV) with an .xls extension perfectly
    const tsvContent = [
      headers.join("\t"),
      ...rows.map(row => 
        row.map(val => {
          const str = String(val === null || val === undefined ? "" : val);
          return str.replace(/\t/g, " ").replace(/\n/g, " ");
        }).join("\t")
      )
    ].join("\n");

    const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportToPDF(title: string, headers: string[], rows: any[][], filename: string): void {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker prevented report download. Please allow popups for this site.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            h1 { font-size: 24px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            p.meta { font-size: 12px; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; text-align: left; padding: 12px 10px; border-bottom: 2px solid #e5e7eb; font-weight: bold; font-size: 13px; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; vertical-align: top; }
            tr:nth-child(even) { background-color: #f9fafb; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="meta">Generated on: ${new Date().toLocaleString()} | AgriTech Platform Intelligence Report</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(val => `<td>${val === null || val === undefined ? "" : String(val).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              // Close print tab window after print action completes
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
