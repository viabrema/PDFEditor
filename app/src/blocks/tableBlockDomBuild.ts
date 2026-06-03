import type { ExcelTableMerge } from "../services/excelRange";
import {
  cellStyleToCssString,
  scaleExcelCellStyleFontSize,
} from "../services/excelTableStyle";
import {
  buildResolvedCellStylesMap,
  type TableBlockStyleContent,
} from "./tableFormatting";
import {
  TABLE_BLOCK_BASE_FONT_PX,
  cellValueForDisplay,
  clampLinkedTableFontScale,
} from "./tableBlockData";
import { normalizeColWidths, syncTableColgroup } from "./tableColumnWidths";

export type UpdateTableBodyOptions = {
  fontScale?: number;
  colWidths?: (number | null)[] | null;
  colLayoutMode?: "view" | "structure";
};

function buildMergedCellSkipSet(merges: ExcelTableMerge[]): Set<string> {
  const skip = new Set<string>();
  for (const m of merges) {
    for (let dr = 0; dr < m.rowspan; dr++) {
      for (let dc = 0; dc < m.colspan; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        skip.add(`${m.r + dr},${m.c + dc}`);
      }
    }
  }
  return skip;
}

function colCount(rows: string[][]) {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

/** `rowHeights` mantem-se no modelo para exportacao PDF; no canvas as linhas seguem a altura do conteudo. */
export function updateTableBody(
  table: HTMLTableElement,
  rows: string[][],
  merges: ExcelTableMerge[] | null | undefined = null,
  styleContent: TableBlockStyleContent | null | undefined = null,
  _rowHeights: (number | null)[] | null | undefined = null,
  options: UpdateTableBodyOptions = {},
) {
  const fontScale =
    typeof options.fontScale === "number" && options.fontScale > 0
      ? clampLinkedTableFontScale(options.fontScale)
      : 1;
  const list = Array.isArray(merges) ? merges : [];
  const skip = buildMergedCellSkipSet(list);
  const mergeAt = new Map<string, ExcelTableMerge>();
  for (const m of list) {
    mergeAt.set(`${m.r},${m.c}`, m);
  }
  const styles = styleContent
    ? buildResolvedCellStylesMap({ ...styleContent, rows })
    : null;

  const dataCols = colCount(rows);
  const widthCols = Array.isArray(options.colWidths) ? options.colWidths.length : 0;
  const cols = Math.max(dataCols, widthCols);
  const colWidths = normalizeColWidths(cols, options.colWidths);
  const colLayoutMode = options.colLayoutMode === "view" ? "view" : "structure";
  table.innerHTML = "";

  const thead = document.createElement("thead");
  const headTr = document.createElement("tr");
  const corner = document.createElement("th");
  corner.className = "table-select-corner";
  corner.setAttribute("aria-hidden", "true");
  headTr.append(corner);
  for (let c = 0; c < cols; c++) {
    const th = document.createElement("th");
    th.className = "table-col-select";
    th.dataset.tableCol = String(c);
    th.title = `Selecionar coluna ${c + 1}`;
    th.setAttribute("aria-label", `Selecionar coluna ${c + 1}`);
    const resizeHandle = document.createElement("span");
    resizeHandle.className = "table-col-resize-handle";
    resizeHandle.dataset.tableCol = String(c);
    resizeHandle.title = "Redimensionar coluna";
    resizeHandle.setAttribute("role", "separator");
    resizeHandle.setAttribute("aria-orientation", "vertical");
    resizeHandle.setAttribute("aria-label", `Redimensionar coluna ${c + 1}`);
    th.append(resizeHandle);
    headTr.append(th);
  }
  thead.append(headTr);
  table.append(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row, r) => {
    const tr = document.createElement("tr");
    const rowHead = document.createElement("th");
    rowHead.className = "table-row-select";
    rowHead.dataset.tableRow = String(r);
    rowHead.title = `Selecionar linha ${r + 1}`;
    rowHead.setAttribute("aria-label", `Selecionar linha ${r + 1}`);
    tr.append(rowHead);

    for (let c = 0; c < cols; c++) {
      if (skip.has(`${r},${c}`)) {
        continue;
      }
      const td = document.createElement("td");
      td.contentEditable = "false";
      td.dataset.tableRow = String(r);
      td.dataset.tableCol = String(c);
      td.textContent = cellValueForDisplay(row[c] ?? "");
      const st = styles?.[`${r},${c}`];
      if (st) {
        const scaled = fontScale !== 1 ? scaleExcelCellStyleFontSize(st, fontScale) : st;
        const css = cellStyleToCssString(scaled);
        if (css) {
          td.setAttribute("style", css);
        }
      }
      const m = mergeAt.get(`${r},${c}`);
      if (m && (m.rowspan > 1 || m.colspan > 1)) {
        if (m.rowspan > 1) {
          td.rowSpan = m.rowspan;
        }
        if (m.colspan > 1) {
          td.colSpan = m.colspan;
        }
      }
      tr.append(td);
    }
    tbody.append(tr);
  });
  table.append(tbody);
  syncTableColgroup(table, colWidths, colLayoutMode);

  if (fontScale !== 1) {
    table.style.fontSize = `${TABLE_BLOCK_BASE_FONT_PX * fontScale}px`;
  } else {
    table.style.fontSize = "";
  }
}
