import {
  applyColWidthsToTable,
  normalizeColWidths,
  readColWidthsFromTable,
  resizeColumnAt,
  TABLE_MIN_COL_WIDTH_PX,
} from "./tableColumnWidths";

export function attachTableColumnResize(
  table: HTMLTableElement,
  options: {
    getColCount: () => number;
    getColWidths: () => number[];
    setColWidths: (widths: number[]) => void;
    onResizeSessionStart?: () => void;
    onResizeSessionEnd?: () => void;
  },
) {
  let resizing: { col: number; startX: number; startWidth: number } | null = null;
  let sessionStarted = false;

  const endResize = () => {
    /* v8 ignore start -- listener pode correr apos resize ja ter terminado */
    if (!resizing) {
      return;
    }
    /* v8 ignore end */
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    table.classList.remove("is-col-resizing");
    resizing = null;
    const hadSession = sessionStarted;
    sessionStarted = false;
    if (hadSession) {
      options.onResizeSessionEnd?.();
    }
  };

  const onMove = (event: MouseEvent) => {
    /* v8 ignore start */
    if (!resizing) {
      return;
    }
    /* v8 ignore end */
    event.preventDefault();
    const delta = event.clientX - resizing.startX;
    const next = resizeColumnAt(
      options.getColWidths(),
      resizing.col,
      resizing.startWidth + delta,
    );
    options.setColWidths(next);
    applyColWidthsToTable(table, next);
  };

  const onUp = () => {
    endResize();
  };

  table.addEventListener("mousedown", (event) => {
    if (!table.classList.contains("is-structure-mode")) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    const handle = (event.target as HTMLElement | null)?.closest?.(".table-col-resize-handle");
    if (!handle || !table.contains(handle)) {
      return;
    }
    const col = Number((handle as HTMLElement).dataset.tableCol);
    if (!Number.isFinite(col)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const colCount = options.getColCount();
    const widths = normalizeColWidths(colCount, options.getColWidths());
    const live = readColWidthsFromTable(table, colCount);
    const startWidth = live[col] ?? widths[col] ?? TABLE_MIN_COL_WIDTH_PX;

    if (!sessionStarted) {
      options.onResizeSessionStart?.();
      sessionStarted = true;
    }

    resizing = { col, startX: event.clientX, startWidth };
    table.classList.add("is-col-resizing");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}
