export function buildExportPrintStyles(pageSize: { width: number; height: number }) {
  return `
    @page { size: ${pageSize.width}px ${pageSize.height}px; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; }
    .document { display: flex; flex-direction: column; gap: 24px; padding: 24px; }
    .page { position: relative; background: #fff; border: 1px solid #e2e8f0; }
    .block-wrapper { position: absolute; }
    .block { width: 100%; height: 100%; }
    .text-block { font-size: 14px; line-height: 1.4; padding: 12px; overflow: hidden; }
    .text-block-export-flow { min-height: 0; }
    .text-block p { margin: 0 0 10px; }
    .text-block p:last-child { margin-bottom: 0; }
    .text-block h1 { margin: 0 0 12px; font-size: 24px; color: #008737; }
    .text-block h2 { margin: 0 0 10px; font-size: 18px; }
    .text-block ul,
    .text-block ol { margin: 0; padding-left: 20px; list-style-position: outside; }
    .text-block hr { border: none; border-top: 1px solid #0f172a; margin: 10px 0; }
    .image-block img { width: 100%; height: 100%; object-fit: cover; }
    .chart-block-export { width: 100%; height: 100%; overflow: hidden; background: #fff; }
    .table-block { overflow: hidden; }
    .table-block-export-clip { width: 100%; height: 100%; overflow: hidden; }
    .table-block table { width: 100%; height: auto; border-collapse: collapse; table-layout: fixed; }
    .table-block table.table-block-excel {
      height: 100%;
      min-height: 100%;
    }
    .table-block table.table-block-excel tbody {
      height: 100%;
    }
    .table-block table.table-block-excel tbody tr {
      height: 1px;
    }
    .table-block td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      font-size: 14px;
      vertical-align: top;
      overflow: hidden;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .table-block-excel td {
      border: none;
      padding: 2px 6px;
      line-height: 1.15;
    }
    @media print {
      body { margin: 0; }
      .document { padding: 0; gap: 0; }
      .page { page-break-after: always; border: none; }
    }
  `;
}
