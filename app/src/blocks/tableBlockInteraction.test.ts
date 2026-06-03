import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { TABLE_CELL_EMPTY_PLACEHOLDER } from "./tableBlockData";
import { updateTableBody } from "./tableBlockDomBuild";
import {
  applyTableDomMode,
  normalizeTypingCellContent,
  refreshTableSelectionChrome,
  resolveTableDomMode,
  type TableEditState,
} from "./tableBlockInteraction";

describe("tableBlockInteraction", () => {
  function tableWithRows() {
    const w = new Window();
    globalThis.document = w.document;
    const table = w.document.createElement("table");
    updateTableBody(table, [
      ["a", "b"],
      ["c", "d"],
    ]);
    return table;
  }

  it("resolveTableDomMode returns view when not editing", () => {
    expect(resolveTableDomMode("b1", null, null)).toBe("view");
  });

  it("resolveTableDomMode returns structure when editing without typing", () => {
    const edit: TableEditState = {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    };
    expect(resolveTableDomMode("b1", "b1", edit)).toBe("structure");
  });

  it("resolveTableDomMode returns cell-type when typing", () => {
    const edit: TableEditState = {
      blockId: "b1",
      scope: "cell",
      row: 1,
      col: 1,
      typing: true,
    };
    expect(resolveTableDomMode("b1", "b1", edit)).toBe("cell-type");
  });

  it("applyTableDomMode in view mode clears selection chrome", () => {
    const table = tableWithRows();
    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "column",
      row: 0,
      col: 1,
      typing: false,
    });
    applyTableDomMode(table, "view", {
      blockId: "b1",
      scope: "column",
      row: 0,
      col: 1,
      typing: false,
    });
    expect(table.querySelectorAll(".is-selected").length).toBe(0);
  });

  it("applyTableDomMode enables only typing cell", () => {
    const table = tableWithRows();
    const edit: TableEditState = {
      blockId: "b1",
      scope: "cell",
      row: 1,
      col: 1,
      typing: true,
    };
    applyTableDomMode(table, "cell-type", edit);
    const cells = Array.from(table.querySelectorAll("td"));
    expect(cells.filter((c) => c.classList.contains("is-typing-cell"))).toHaveLength(1);
    expect(cells.find((c) => c.classList.contains("is-typing-cell"))?.contentEditable).toBe("true");
    expect(cells.filter((c) => c.contentEditable === "true")).toHaveLength(1);
  });

  it("refreshTableSelectionChrome highlights column", () => {
    const table = tableWithRows();
    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "column",
      row: 0,
      col: 1,
      typing: false,
    });
    expect(table.querySelector('.table-col-select[data-table-col="1"]')?.classList.contains("is-selected")).toBe(
      true,
    );
    expect(table.querySelectorAll("td.is-selected").length).toBe(2);
  });

  it("refreshTableSelectionChrome highlights row", () => {
    const table = tableWithRows();
    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "row",
      row: 1,
      col: 0,
      typing: false,
    });
    expect(table.querySelector('.table-row-select[data-table-row="1"]')?.classList.contains("is-selected")).toBe(
      true,
    );
    expect(table.querySelectorAll("td.is-selected").length).toBe(2);
  });

  it("refreshTableSelectionChrome highlights single cell", () => {
    const table = tableWithRows();
    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 1,
      typing: false,
    });
    expect(table.querySelectorAll("td.is-selected").length).toBe(1);
  });

  it("normalizeTypingCellContent removes lone br in empty cell", () => {
    const w = new Window();
    globalThis.document = w.document;
    const td = w.document.createElement("td");
    td.append(w.document.createElement("br"));
    normalizeTypingCellContent(td);
    expect(td.textContent).toBe(TABLE_CELL_EMPTY_PLACEHOLDER);
  });

  it("normalizeTypingCellContent keeps non-empty cells unchanged", () => {
    const w = new Window();
    globalThis.document = w.document;
    const td = w.document.createElement("td");
    td.textContent = "ok";
    normalizeTypingCellContent(td);
    expect(td.textContent).toBe("ok");
  });

  it("refreshTableSelectionChrome clears when edit is null", () => {
    const table = tableWithRows();
    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    refreshTableSelectionChrome(table, null);
    expect(table.querySelectorAll(".is-selected").length).toBe(0);
  });
});
