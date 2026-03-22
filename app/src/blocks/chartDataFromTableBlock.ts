import type { ChartBlockContent } from "./chartBlockTypes";

export type ResolvedTableData = {
  columnCount: number;
  /** Rótulos por índice de coluna (para UI). */
  columnLabels: string[];
  /** Linhas de dados (após remover cabecalho se aplicável). */
  dataRows: string[][];
  /** Linhas brutas da tabela (incl. possível cabeçalho). */
  rawRows: string[][];
};

function isTableLike(block: { type?: string } | null): block is { type: string; content?: any } {
  return block?.type === "table" || block?.type === "linkedTable";
}

/**
 * Normaliza grelha embutida no bloco chart (ou vinda da IA).
 */
export function normalizeChartDataSourceRows(rows: unknown): string[][] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row: unknown) =>
    Array.isArray(row) ? row.map((c) => (c == null ? "" : String(c))) : [],
  );
}

/**
 * Extrai `content.rows` de um bloco table/linkedTable (migracao legada).
 */
export function getTableRowsFromBlock(block: { content?: { rows?: unknown } } | null): string[][] {
  if (!block?.content || !Array.isArray(block.content.rows)) {
    return [];
  }
  return block.content.rows.map((row: unknown) =>
    Array.isArray(row) ? row.map((c) => (c == null ? "" : String(c))) : [],
  );
}

/**
 * Resolve dados tabulares: prioridade a `dataSourceRows` no bloco chart;
 * senão documentos antigos com `dataSourceBlockId` + bloco tabela.
 */
export function resolveChartTableData(
  blocks: { id: string; type?: string; content?: any }[],
  content: ChartBlockContent,
): { ok: true; data: ResolvedTableData } | { ok: false; message: string } {
  let rawRows = normalizeChartDataSourceRows(content.dataSourceRows);

  if (rawRows.length === 0 && content.dataSourceBlockId) {
    const block = blocks.find((b) => b.id === content.dataSourceBlockId) || null;
    if (block && isTableLike(block)) {
      rawRows = getTableRowsFromBlock(block);
    }
  }

  if (rawRows.length === 0) {
    return { ok: false, message: "Adicione dados na grelha (aba Fonte de dados)." };
  }

  let maxCols = 0;
  rawRows.forEach((r) => {
    maxCols = Math.max(maxCols, r.length);
  });
  if (maxCols < 1) {
    return { ok: false, message: "A grelha de dados precisa de pelo menos uma coluna." };
  }

  rawRows = rawRows.map((r) => {
    const next = [...r];
    while (next.length < maxCols) {
      next.push("");
    }
    return next.slice(0, maxCols);
  });

  const headerRow = content.firstRowIsHeader ? rawRows[0] || [] : null;
  const dataRows = content.firstRowIsHeader ? rawRows.slice(1) : rawRows;

  const columnLabels: string[] = [];
  for (let c = 0; c < maxCols; c += 1) {
    const fromHeader = headerRow && headerRow[c] != null && String(headerRow[c]).trim() !== "";
    columnLabels.push(
      fromHeader ? String(headerRow[c]).trim() : `Coluna ${c + 1}`,
    );
  }

  return {
    ok: true,
    data: {
      columnCount: maxCols,
      columnLabels,
      dataRows,
      rawRows,
    },
  };
}

export function parseCellNumber(cell: string): number | null {
  if (cell == null) {
    return null;
  }
  const s = String(cell).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") {
    return null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
