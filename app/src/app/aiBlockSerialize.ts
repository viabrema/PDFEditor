import { extractTextFromNode } from "./textUtils";

/** Snapshot completo de um bloco para o prompt da IA (conteúdo editável). */
export function serializeBlockForAi(block: any) {
  if (block.type === "chart") {
    const c = block.content || {};
    const chart = c.chart && typeof c.chart === "object" ? { ...c.chart } : {};
    const rows = Array.isArray(c.dataSourceRows) ? c.dataSourceRows : [];
    return {
      id: block.id,
      type: block.type,
      position: block.position,
      size: block.size,
      configured: Boolean(c.configured),
      dataSourceRows: rows,
      firstRowIsHeader: c.firstRowIsHeader !== false,
      chart,
    };
  }
  if (block.type === "table" || block.type === "linkedTable") {
    const rows = Array.isArray(block.content?.rows) ? block.content.rows : [];
    const base: Record<string, unknown> = {
      id: block.id,
      type: block.type,
      position: block.position,
      size: block.size,
      content: rows,
    };
    if (block.type === "linkedTable" && block.metadata?.excelLink) {
      const link = block.metadata.excelLink;
      base.excelLink = {
        sheetName: link.sheetName,
        range: link.range,
        fileHint: typeof link.filePath === "string" ? link.filePath.split(/[/\\]/).pop() : "",
      };
    }
    if (block.metadata?.excludeFromPdfExport === true) {
      base.excludeFromPdfExport = true;
    }
    return base;
  }
  if (block.type === "image") {
    return {
      id: block.id,
      type: block.type,
      position: block.position,
      size: block.size,
      content: { src: block.content?.src || "" },
    };
  }
  return {
    id: block.id,
    type: block.type,
    position: block.position,
    size: block.size,
    content: block.content,
  };
}

/** Uma linha legível para o mapa de layout (todas as páginas). */
export function summarizeBlockForLayout(block: any): string {
  if (block.type === "chart") {
    const rows = block.content?.dataSourceRows;
    const r = Array.isArray(rows) ? rows.length : 0;
    const c0 = Array.isArray(rows) && rows[0] ? rows[0].length : 0;
    const bt = block.content?.chart?.baseType || "?";
    return `[grafico; grelha ${r}x${c0}; tipo ${bt}]`;
  }
  if (block.type === "table" || block.type === "linkedTable") {
    const rows = Array.isArray(block.content?.rows) ? block.content.rows : [];
    const cols = rows[0]?.length ?? 0;
    const noPdf = block.metadata?.excludeFromPdfExport ? "; aux nao-export-pdf" : "";
    return `[tabela ${rows.length}x${cols}${noPdf}]`;
  }
  if (block.type === "image") {
    return block.content?.src ? "[imagem]" : "[imagem vazia]";
  }
  const t = extractTextFromNode(block.content).trim().replace(/\s+/g, " ");
  const max = 80;
  if (!t) {
    return "(sem texto)";
  }
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function blockRegion(block: any): "body" | "header" | "footer" {
  const r = block.metadata?.region;
  if (r === "header" || r === "footer") {
    return r;
  }
  return "body";
}
