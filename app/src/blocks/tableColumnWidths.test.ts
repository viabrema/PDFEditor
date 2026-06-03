import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import {
  applyColWidthsToTable,
  colWidthsForTableBlock,
  resolveTableColLayoutMode,
  normalizeColWidths,
  readColWidthsFromTable,
  resizeColumnAt,
  sumColWidths,
  syncTableColgroup,
  tableDataColCount,
  TABLE_DEFAULT_COL_WIDTH_PX,
  TABLE_MIN_COL_WIDTH_PX,
  tableWidthFromColWidths,
} from "./tableColumnWidths";
import { updateTableBody } from "./tableBlockDomBuild";

describe("tableColumnWidths", () => {
  it("tableDataColCount uses max of row width and colWidths length", () => {
    expect(tableDataColCount([["a"]], [80, 90])).toBe(2);
    expect(tableDataColCount([["a", "b"]])).toBe(2);
  });

  it("normalizeColWidths fills defaults and clamps", () => {
    expect(normalizeColWidths(2)).toEqual([
      TABLE_DEFAULT_COL_WIDTH_PX,
      TABLE_DEFAULT_COL_WIDTH_PX,
    ]);
    expect(normalizeColWidths(2, [50, null])).toEqual([50, TABLE_DEFAULT_COL_WIDTH_PX]);
    expect(normalizeColWidths(1, [10])).toEqual([TABLE_MIN_COL_WIDTH_PX]);
  });

  it("resizeColumnAt updates one column", () => {
    expect(resizeColumnAt([100, 100], 1, 180)).toEqual([100, 180]);
    expect(resizeColumnAt([100], 5, 200)).toEqual([100]);
  });

  it("tableWidthFromColWidths includes row head", () => {
    expect(sumColWidths([100, 50])).toBe(150);
    expect(tableWidthFromColWidths([100, 50])).toBeGreaterThan(150);
  });

  it("readColWidthsFromTable and applyColWidthsToTable handle missing col elements", () => {
    const window = new Window();
    globalThis.document = window.document;
    const bare = document.createElement("table");
    expect(readColWidthsFromTable(bare, 2)).toEqual([
      TABLE_DEFAULT_COL_WIDTH_PX,
      TABLE_DEFAULT_COL_WIDTH_PX,
    ]);
    applyColWidthsToTable(bare, [90, 110]);
  });

  it("resolveTableColLayoutMode reads table class", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    table.classList.add("is-view-mode");
    expect(resolveTableColLayoutMode(table)).toBe("view");
    table.classList.remove("is-view-mode");
    expect(resolveTableColLayoutMode(table)).toBe("structure");
  });

  it("syncTableColgroup prepends colgroup when table has no thead", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    syncTableColgroup(table, [100], "structure");
    expect(table.querySelector("colgroup")).not.toBeNull();
  });

  it("colWidthsForTableBlock returns empty without content", () => {
    expect(colWidthsForTableBlock({ type: "table" })).toEqual([]);
  });

  it("colWidthsForTableBlock normalizes from content", () => {
    expect(
      colWidthsForTableBlock({
        type: "table",
        content: { rows: [["a", "b"]], colWidths: [90, 110] },
      }),
    ).toEqual([90, 110]);
  });

  it("readColWidthsFromTable ignores percent widths", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    syncTableColgroup(table, [100, 200], "view");
    const cols = table.querySelectorAll("colgroup col[data-table-col]");
    (cols[0] as HTMLTableColElement).style.width = "40%";
    expect(readColWidthsFromTable(table, 2)).toEqual([
      TABLE_DEFAULT_COL_WIDTH_PX,
      200,
    ]);
  });

  it("syncTableColgroup view mode omits corner column", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    syncTableColgroup(table, [100, 200], "view");
    expect(table.querySelectorAll("colgroup .table-corner-col").length).toBe(0);
    expect(table.querySelectorAll("colgroup col[data-table-col]").length).toBe(2);
  });

  it("applyColWidthsToTable and readColWidthsFromTable round-trip", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    table.classList.add("is-structure-mode");
    updateTableBody(table, [["a", "b"]], [], null, null, {
      colWidths: [90, 110],
      colLayoutMode: "structure",
    });
    expect(readColWidthsFromTable(table, 2)).toEqual([90, 110]);
    applyColWidthsToTable(table, [140, 60]);
    expect(readColWidthsFromTable(table, 2)).toEqual([140, 60]);
  });
});
