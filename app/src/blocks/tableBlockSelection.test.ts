import { describe, expect, it } from "vitest";
import {
  hasMultiSelection,
  isCellInMultiSelection,
  rectCellCoords,
  selectionForTyping,
  selectionFromCellClick,
  selectionFromCellDrag,
  selectionFromColClick,
  selectionFromColDrag,
  selectionFromRowClick,
  selectionFromRowDrag,
} from "./tableBlockSelection";
import {
  applyFormatPatchToEdit,
  effectiveFormatScope,
  formatTargetsFromEdit,
} from "./tableFormatting";
import type { TableEditState } from "./tableBlockInteraction";

const base = (patch: Partial<TableEditState>): TableEditState => ({
  blockId: "b1",
  scope: "cell",
  row: 0,
  col: 0,
  typing: false,
  ...patch,
});

describe("tableBlockSelection", () => {
  it("rectCellCoords returns inclusive rectangle", () => {
    expect(rectCellCoords(0, 0, 1, 1)).toHaveLength(4);
    expect(rectCellCoords(1, 0, 0, 0)).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ]);
  });

  it("single cell click clears multi", () => {
    const prev = base({ multi: { cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] } });
    const next = selectionFromCellClick(prev, 1, 1);
    expect(next.multi).toBeUndefined();
    expect(next.row).toBe(1);
    expect(next.col).toBe(1);
  });

  it("shift+click with no prior edit on same row or column stays single", () => {
    expect(selectionFromColClick(null, 0, { shift: true }).multi).toBeUndefined();
    expect(selectionFromRowClick(null, 0, { shift: true }).multi).toBeUndefined();
    expect(selectionFromCellClick(null, 0, 1, { shift: true }).multi?.cells).toHaveLength(2);
  });

  it("shift+click on same cell keeps single selection", () => {
    const prev = base({ row: 0, col: 0, anchor: { scope: "cell", row: 0, col: 0 } });
    expect(selectionFromCellClick(prev, 0, 0, { shift: true }).multi).toBeUndefined();
  });

  it("shift+click selects cell rectangle from anchor", () => {
    const prev = base({ row: 0, col: 0, anchor: { scope: "cell", row: 0, col: 0 } });
    const next = selectionFromCellClick(prev, 1, 1, { shift: true });
    expect(next.multi?.cells).toHaveLength(4);
  });

  it("shift+click on cells uses row focus when anchor is not cell", () => {
    const prev = base({
      scope: "row",
      row: 1,
      col: 0,
      anchor: { scope: "row", row: 1, col: 0 },
    });
    const next = selectionFromCellClick(prev, 1, 2, { shift: true });
    expect(next.multi?.cells?.length).toBeGreaterThan(1);
  });

  it("shift+click uses prev focus when anchor is not cell", () => {
    const prevCol = base({
      scope: "column",
      col: 1,
      anchor: { scope: "column", row: 0, col: 1 },
    });
    expect(selectionFromCellClick(prevCol, 0, 2, { shift: true }).multi?.cells?.length).toBeGreaterThan(
      1,
    );

    const prev = base({
      scope: "column",
      col: 1,
      anchor: { scope: "column", row: 0, col: 1 },
    });
    const next = selectionFromCellClick(prev, 1, 0, { shift: true });
    expect(next.multi?.cells?.length).toBeGreaterThan(1);
  });

  it("ctrl+click toggles cells in selection", () => {
    const prev = base({ row: 0, col: 0, anchor: { scope: "cell", row: 0, col: 0 } });
    const add = selectionFromCellClick(prev, 0, 1, { ctrl: true });
    expect(add.multi?.cells).toHaveLength(2);
    const remove = selectionFromCellClick(
      base({ ...add, multi: add.multi, anchor: add.anchor }),
      0,
      1,
      { ctrl: true },
    );
    expect(remove.multi).toBeUndefined();
  });

  it("ctrl+click on last cell clears to single", () => {
    const prev = base({
      multi: { cells: [{ row: 0, col: 0 }] },
      anchor: { scope: "cell", row: 0, col: 0 },
    });
    const next = selectionFromCellClick(prev, 0, 0, { ctrl: true });
    expect(next.multi).toBeUndefined();
  });

  it("row shift and ctrl selection", () => {
    const prev = base({ scope: "row", row: 0, anchor: { scope: "row", row: 0, col: 0 } });
    const range = selectionFromRowClick(prev, 2, { shift: true });
    expect(range.multi?.rows).toEqual([0, 1, 2]);
    const toggle = selectionFromRowClick(prev, 1, { ctrl: true });
    expect(toggle.multi?.rows).toEqual([0, 1]);
  });

  it("column shift and ctrl selection", () => {
    const prev = base({ scope: "column", col: 0, anchor: { scope: "column", row: 0, col: 0 } });
    const range = selectionFromColClick(prev, 2, { shift: true });
    expect(range.multi?.cols).toEqual([0, 1, 2]);
    const toggle = selectionFromColClick(prev, 1, { ctrl: true });
    expect(toggle.multi?.cols).toEqual([0, 1]);
  });

  it("drag helpers build multi ranges", () => {
    expect(selectionFromCellDrag(0, 0, 0, 0).multi).toBeUndefined();
    expect(selectionFromCellDrag(0, 0, 1, 1).multi?.cells).toHaveLength(4);
    expect(selectionFromRowDrag(0, 2).multi?.rows).toEqual([0, 1, 2]);
    expect(selectionFromRowDrag(1, 1).multi).toBeUndefined();
    expect(selectionFromColDrag(1, 1).multi).toBeUndefined();
    expect(selectionForTyping(1, 2).typing).toBe(true);
    expect(selectionForTyping(1, 2).multi).toBeUndefined();
  });

  it("formatTargetsFromEdit expands multi", () => {
    expect(
      formatTargetsFromEdit(base({ multi: { cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }] } })),
    ).toHaveLength(2);
    expect(formatTargetsFromEdit(base({ multi: { rows: [0, 2] } }))).toEqual([
      { scope: "row", row: 0, col: 0 },
      { scope: "row", row: 2, col: 0 },
    ]);
    expect(formatTargetsFromEdit(base({ multi: { cols: [1, 3] } }))).toHaveLength(2);
    expect(formatTargetsFromEdit(null)).toHaveLength(1);
  });

  it("applyFormatPatchToEdit patches all targets", () => {
    const content = { rows: [["a", "b"], ["c", "d"]], cellStyles: {} };
    applyFormatPatchToEdit(
      content,
      base({ multi: { cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] } }),
      { color: "#111" },
    );
    expect(content.cellStyles?.["0,0"]?.color).toBe("#111");
    expect(content.cellStyles?.["0,1"]?.color).toBe("#111");
  });

  it("effectiveFormatScope and hasMultiSelection", () => {
    expect(effectiveFormatScope(base({ multi: { rows: [0, 1] } }))).toBe("row");
    expect(effectiveFormatScope(base({ multi: { cells: [{ row: 0, col: 0 }] } }))).toBe("cell");
    expect(effectiveFormatScope(null)).toBe("cell");
    expect(hasMultiSelection(base({ multi: { cells: [{ row: 0, col: 0 }] } }))).toBe(false);
    expect(hasMultiSelection(base({ multi: { cols: [0, 1] } }))).toBe(true);
    expect(isCellInMultiSelection(base({ scope: "row", row: 1 }), 1, 0)).toBe(true);
    expect(isCellInMultiSelection(base({ scope: "column", col: 2 }), 0, 2)).toBe(true);
    expect(isCellInMultiSelection(base({ scope: "cell", row: 0, col: 1 }), 0, 1)).toBe(true);
    expect(isCellInMultiSelection(null, 0, 0)).toBe(false);
    expect(isCellInMultiSelection(base({ multi: { cells: [{ row: 1, col: 1 }] } }), 0, 0)).toBe(false);
  });

  it("isCellInMultiSelection handles multi lists and misses", () => {
    expect(
      isCellInMultiSelection(
        base({ multi: { cells: [{ row: 0, col: 0 }] } }),
        0,
        0,
      ),
    ).toBe(true);
    expect(
      isCellInMultiSelection(base({ multi: { rows: [2] }, scope: "row", row: 2 }), 2, 5),
    ).toBe(true);
    expect(
      isCellInMultiSelection(base({ multi: { cols: [3] }, scope: "column", col: 3 }), 9, 3),
    ).toBe(true);
    expect(
      isCellInMultiSelection(base({ multi: { cells: [{ row: 1, col: 1 }] } }), 0, 0),
    ).toBe(false);
    expect(hasMultiSelection(base({}))).toBe(false);
  });

  it("ctrl row from cell focus selects a single row", () => {
    const next = selectionFromRowClick(base({ scope: "cell", row: 0, col: 0 }), 2, { ctrl: true });
    expect(next.multi).toBeUndefined();
    expect(next.scope).toBe("row");
    expect(next.row).toBe(2);
  });

  it("ctrl row extends from focused row header", () => {
    const prev = base({ scope: "row", row: 0, anchor: { scope: "row", row: 0, col: 0 } });
    expect(selectionFromRowClick(prev, 1, { ctrl: true }).multi?.rows).toEqual([0, 1]);
  });

  it("ctrl column extends from focused column header", () => {
    const prev = base({ scope: "column", col: 0, anchor: { scope: "column", row: 0, col: 0 } });
    expect(selectionFromColClick(prev, 1, { ctrl: true }).multi?.cols).toEqual([0, 1]);
  });

  it("shift range uses anchor row or column when scope matches", () => {
    const rowAnchor = base({
      scope: "row",
      row: 0,
      anchor: { scope: "row", row: 0, col: 0 },
    });
    expect(selectionFromRowClick(rowAnchor, 2, { shift: true }).multi?.rows).toEqual([0, 1, 2]);
    expect(selectionFromRowClick(rowAnchor, 0, { shift: true }).multi).toBeUndefined();

    const colAnchor = base({
      scope: "column",
      col: 0,
      anchor: { scope: "column", row: 0, col: 0 },
    });
    expect(selectionFromColClick(colAnchor, 2, { shift: true }).multi?.cols).toEqual([0, 1, 2]);
    expect(selectionFromColClick(colAnchor, 0, { shift: true }).multi).toBeUndefined();
  });

  it("ctrl column from cell focus adds one column", () => {
    const next = selectionFromColClick(base({ scope: "cell", row: 0, col: 0 }), 2, { ctrl: true });
    expect(next.col).toBe(2);
    expect(next.multi).toBeUndefined();
  });

  it("ctrl cell from row focus seeds selection via empty ctrl list", () => {
    const next = selectionFromCellClick(base({ scope: "row", row: 0 }), 0, 2, { ctrl: true });
    expect(next.row).toBe(0);
    expect(next.col).toBe(2);
  });

  it("shift column range uses previous focus when anchor is cell", () => {
    const prev = base({ scope: "cell", row: 0, col: 0, anchor: { scope: "cell", row: 0, col: 0 } });
    const next = selectionFromColClick(prev, 2, { shift: true });
    expect(next.multi?.cols).toEqual([0, 1, 2]);
  });

  it("ctrl toggles row and column off to empty then single", () => {
    const prevRow = base({
      scope: "row",
      row: 0,
      multi: { rows: [0] },
      anchor: { scope: "row", row: 0, col: 0 },
    });
    expect(selectionFromRowClick(prevRow, 0, { ctrl: true }).multi).toBeUndefined();

    const prevCol = base({
      scope: "column",
      col: 1,
      multi: { cols: [1] },
      anchor: { scope: "column", row: 0, col: 1 },
    });
    expect(selectionFromColClick(prevCol, 1, { ctrl: true }).multi).toBeUndefined();

    const prevRows = base({
      scope: "row",
      row: 1,
      multi: { rows: [0, 1] },
      anchor: { scope: "row", row: 0, col: 0 },
    });
    const oneRow = selectionFromRowClick(prevRows, 0, { ctrl: true });
    expect(oneRow.multi).toBeUndefined();
    expect(oneRow.row).toBe(1);
  });
});
