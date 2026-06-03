import {
  formatDataLayerCellForDisplay,
  getTableDataRows,
  getTableStructureMerges,
  normalizeLinkedTableContent,
} from "../blocks/linkedTableModel";
import type { ExcelTableMerge } from "../services/excelRange";

let modalController: { open: (block: { content?: unknown }) => void } | null = null;

export function openLinkedTableDataSource(block: unknown) {
  if (!block || typeof block !== "object") {
    return;
  }
  modalController?.open(block as { content?: unknown });
}

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

function renderDataGrid(host: HTMLElement, rows: string[][], merges: ExcelTableMerge[]) {
  host.innerHTML = "";
  const skip = buildMergedCellSkipSet(merges);
  const mergeAt = new Map(merges.map((m) => [`${m.r},${m.c}`, m] as const));
  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const table = document.createElement("table");
  table.className = "w-full border-collapse text-sm font-mono";
  rows.forEach((row, r) => {
    const tr = document.createElement("tr");
    for (let c = 0; c < colCount; c++) {
      if (skip.has(`${r},${c}`)) {
        continue;
      }
      const td = document.createElement("td");
      td.className = "border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-800";
      td.textContent = formatDataLayerCellForDisplay(row[c] ?? "");
      const m = mergeAt.get(`${r},${c}`);
      if (m?.rowspan && m.rowspan > 1) {
        td.rowSpan = m.rowspan;
      }
      if (m?.colspan && m.colspan > 1) {
        td.colSpan = m.colspan;
      }
      tr.append(td);
    }
    table.append(tr);
  });
  host.append(table);
}

export function bindLinkedTableDataModal(refs: Record<string, Element | null>) {
  const modal = refs.linkedTableDataModal as HTMLElement | null;
  const gridHost = refs.linkedTableDataGrid as HTMLElement | null;
  const closeBtn = refs.linkedTableDataClose as HTMLButtonElement | null;
  if (!modal || !gridHost) {
    return;
  }

  const hide = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
  };

  const show = () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
  };

  closeBtn?.addEventListener("click", hide);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      hide();
    }
  });

  modalController = {
    open(block) {
      normalizeLinkedTableContent(block);
      const rows = getTableDataRows(block);
      const merges = getTableStructureMerges(block);
      renderDataGrid(gridHost, rows, merges);
      show();
    },
  };
}
