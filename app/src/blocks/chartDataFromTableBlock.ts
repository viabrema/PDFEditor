import type { ChartBlockContent } from "./chartBlockTypes";

export type ResolvedTableData = {
  columnCount: number;
  /** Rótulos por índice de coluna (para UI). */
  columnLabels: string[];
  /** Linhas de dados (após remover cabeçalho se aplicável). */
  dataRows: string[][];
  /** Linhas brutas da tabela (incl. possível cabeçalho). */
  rawRows: string[][];
};

function isTableLike(block: { type?: string } | null): block is { type: string; content?: any } {
  return block?.type === "table" || block?.type === "linkedTable";
}

/**
 * Extrai `content.rows` de um bloco table/linkedTable.
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
 * Resolve dados tabulares a partir do id da fonte e flags do chart.
 */
export function resolveChartTableData(
  blocks: { id: string; type?: string; content?: any }[],
  content: ChartBlockContent,
): { ok: true; data: ResolvedTableData } | { ok: false; message: string } {
  const id = content.dataSourceBlockId;
  if (!id) {
    return { ok: false, message: "Nenhuma tabela selecionada como fonte." };
  }
  const block = blocks.find((b) => b.id === id) || null;
  if (!block || !isTableLike(block)) {
    return { ok: false, message: "Bloco fonte nao encontrado ou nao e uma tabela." };
  }
  const rawRows = getTableRowsFromBlock(block);
  if (rawRows.length === 0) {
    return { ok: false, message: "A tabela fonte esta vazia." };
  }

  let maxCols = 0;
  rawRows.forEach((r) => {
    maxCols = Math.max(maxCols, r.length);
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
