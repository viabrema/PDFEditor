import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "./blockModel";
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

  it("applyTableDomMode syncs colgroup when block has colWidths without rows", () => {
    const table = tableWithRows();
    applyTableDomMode(table, "view", null, {
      block: { type: BLOCK_TYPES.TABLE, content: { colWidths: [100, 200] } },
    });
    expect(table.querySelectorAll("colgroup col[data-table-col]").length).toBe(2);
  });

  it("applyTableDomMode switches colgroup to percent widths in view mode", () => {
    const table = tableWithRows();
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: { rows: [["a", "b"]], colWidths: [80, 160] },
    };
    applyTableDomMode(table, "structure", null, { block });
    expect(table.querySelectorAll("colgroup .table-corner-col").length).toBe(1);
    applyTableDomMode(table, "view", null, { block });
    expect(table.querySelectorAll("colgroup .table-corner-col").length).toBe(0);
    const cols = table.querySelectorAll("colgroup col[data-table-col]");
    expect((cols[0] as HTMLTableColElement).style.width).toBe("80px");
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

  it("refreshTableSelectionChrome highlights multiple cells and columns", () => {
    const table = tableWithRows();
    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "cell",
      row: 1,
      col: 1,
      typing: false,
      multi: { cells: [{ row: 0, col: 0 }, { row: 1, col: 1 }] },
    });
    expect(table.querySelectorAll("td.is-selected").length).toBe(2);

    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "column",
      row: 0,
      col: 0,
      typing: false,
      multi: { cols: [0, 1] },
    });
    expect(table.querySelectorAll(".table-col-select.is-selected").length).toBe(2);
    expect(table.querySelectorAll("td.is-selected").length).toBe(4);

    refreshTableSelectionChrome(table, {
      blockId: "b1",
      scope: "row",
      row: 1,
      col: 0,
      typing: false,
      multi: { rows: [1] },
    });
    expect(table.querySelectorAll("td.is-selected").length).toBe(2);
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

  it("applyTableDomMode shows raw and visual values for linked table", () => {
    const table = tableWithRows();
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [
          ["1000", "b"],
          ["c", "d"],
        ],
        cellStyles: {
          "0,0": { numberFormat: { kind: "number", locale: "pt-BR", decimals: 0 } },
        },
      },
    };
    applyTableDomMode(table, "cell-type", {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    }, { block });
    const typing = table.querySelector("td.is-typing-cell") as HTMLTableCellElement;
    expect(typing.textContent).toBe("1000");

    applyTableDomMode(table, "structure", {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    }, { block });
    const viewCell = table.querySelector('td[data-table-row="0"][data-table-col="0"]') as HTMLTableCellElement;
    expect(viewCell.textContent).not.toBe("1000");

    applyTableDomMode(table, "structure", {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 9,
      typing: false,
    }, { block });
    const sparse = table.querySelector('td[data-table-row="0"][data-table-col="1"]') as HTMLTableCellElement;
    expect(sparse.textContent).toBeTruthy();

    const emptyLinked = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [] },
    };
    applyTableDomMode(table, "structure", {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    }, { block: emptyLinked });
    expect(table.querySelector("td")?.textContent).toBeTruthy();

    const narrow = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["solo"]] },
    };
    const table2 = tableWithRows();
    applyTableDomMode(table2, "structure", {
      blockId: "b1",
      scope: "cell",
      row: 0,
      col: 1,
      typing: false,
    }, { block: narrow });
    const cell01 = table2.querySelector('td[data-table-col="1"]') as HTMLTableCellElement;
    expect(cell01.textContent).toBeTruthy();
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
