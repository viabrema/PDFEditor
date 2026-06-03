import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { BLOCK_TYPES } from "./blockModel";
import {
  computeTableSize,
  createEmptyTable,
  createLinkedTableBlockFromRows,
  createTableBlockFromRows,
  createTableBlockFromText,
  createTableElement,
  normalizeRows,
  parseTabularText,
  cellValueForDisplay,
  cellValueFromDisplay,
  readTableRows,
  setTableEditable,
  syncTableElementWithBlock,
  TABLE_CELL_EMPTY_PLACEHOLDER,
  updateTableBody,
} from "./tableBlock";

describe("table block", () => {
  it("parses tabular text", () => {
    const rows = parseTabularText("a\tb\n1\t2");
    expect(rows).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("returns empty rows for empty text", () => {
    expect(parseTabularText("")).toEqual([]);
  });

  it("returns empty rows for whitespace", () => {
    expect(parseTabularText("   \n ")).toEqual([]);
  });

  it("normalizes row lengths and null input", () => {
    expect(normalizeRows([["a"], ["1", "2"]])).toEqual([["a", ""], ["1", "2"]]);
    expect(normalizeRows(null)).toEqual([]);
  });

  it("creates empty table", () => {
    const rows = createEmptyTable(2, 3);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
  });

  it("computes size with page bounds", () => {
    const size = computeTableSize([["a", "b"]], { width: 300, height: 200 });
    expect(size).toEqual({ width: 236, height: 36 });
  });

  it("computes size without page bounds", () => {
    const size = computeTableSize([["a", "b"]]);
    expect(size).toEqual({ width: 240, height: 36 });
  });

  it("computes size for empty rows", () => {
    const size = computeTableSize([], { width: 300, height: 200 });
    expect(size).toEqual({ width: 120, height: 36 });
  });

  it("linked table uses fallback rows when rows array is empty", () => {
    const block = createLinkedTableBlockFromRows(
      [],
      { filePath: "p", sheetName: "s", range: "A1:A1" },
      {},
    );
    expect(block.content.dataSourceRows.length).toBeGreaterThan(0);
  });

  it("creates linked table block with excel link metadata", () => {
    const block = createLinkedTableBlockFromRows(
      [["a", "b"]],
      { filePath: "C:\\dados\\book.xlsx", sheetName: "Folha1", range: "A1:B1" },
      { pageSize: { width: 900, height: 1200 } },
    );
    expect(block.type).toBe(BLOCK_TYPES.LINKED_TABLE);
    expect(block.metadata.excelLink.filePath).toBe("C:\\dados\\book.xlsx");
    expect(block.metadata.excelLink.sheetName).toBe("Folha1");
    expect(block.metadata.excelLink.range).toBe("A1:B1");
    expect(block.content.dataSourceRows).toEqual([["a", "b"]]);
    expect(block.content.merges).toEqual([]);
    expect(block.content.cellStyles).toEqual({});
  });

  it("linked table stores merges in content", () => {
    const block = createLinkedTableBlockFromRows(
      [
        ["a", "", "b"],
        ["c", "d", "e"],
      ],
      { filePath: "p.xlsx", sheetName: "S", range: "A1:C2" },
      { merges: [{ r: 0, c: 0, rowspan: 2, colspan: 1 }] },
    );
    expect(block.content.merges).toEqual([{ r: 0, c: 0, rowspan: 2, colspan: 1 }]);
  });

  it("linked table ignores invalid merges; updateTableBody colspan-only", () => {
    const linked = createLinkedTableBlockFromRows([["a"]], { filePath: "p", sheetName: "s", range: "A1:A1" }, { merges: 42 as any });
    expect(linked.content.merges).toEqual([]);
    const w = new Window();
    const prevW = globalThis.window;
    const prevD = globalThis.document;
    globalThis.window = w;
    globalThis.document = w.document;
    const table = w.document.createElement("table");
    updateTableBody(table, [["a", ""]], [{ r: 0, c: 0, rowspan: 1, colspan: 2 }]);
    expect(table.querySelector("td")?.colSpan).toBe(2);
    updateTableBody(table, [["a"], [""]], [{ r: 0, c: 0, rowspan: 2, colspan: 1 }]);
    const td = table.querySelector("td");
    expect(td?.rowSpan).toBe(2);
    expect(td?.colSpan).toBe(1);
    globalThis.window = prevW;
    globalThis.document = prevD;
  });

  it("creates read-only table element for linked block", () => {
    const window = new Window();
    const prevWindow = globalThis.window;
    const prevDoc = globalThis.document;
    globalThis.window = window;
    globalThis.document = window.document;
    const block = createLinkedTableBlockFromRows(
      [["x"]],
      { filePath: "p", sheetName: "S", range: "A1:A1" },
      {},
    );
    const table = createTableElement(block, { readOnly: true });
    expect(table.classList.contains("is-linked-table")).toBe(true);
    expect(table.classList.contains("is-readonly")).toBe(true);
    const td = table.querySelector("td");
    expect(td?.getAttribute("contenteditable")).toBe("false");
    globalThis.window = prevWindow;
    globalThis.document = prevDoc;
  });

  it("creates table block from rows", () => {
    const block = createTableBlockFromRows([["a", "b"]], {
      pageId: "page-1",
      languageId: "lang-pt",
    });

    expect(block.type).toBe("table");
    expect(block.content.rows).toEqual([["a", "b"]]);
  });

  it("creates table block from text", () => {
    const block = createTableBlockFromText("a\tb", {
      pageId: "page-1",
      languageId: "lang-pt",
    });

    expect(block.content.rows).toEqual([["a", "b"]]);
  });

  it("builds table element and reads rows", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b"]] } };
    const table = createTableElement(block);
    const rows = readTableRows(table);

    expect(rows).toEqual([["a", "b"]]);
  });

  it("cellValue helpers pass through non-empty text", () => {
    expect(cellValueForDisplay("x")).toBe("x");
    expect(cellValueFromDisplay("hello")).toBe("hello");
    expect(cellValueFromDisplay(undefined)).toBe("");
    expect(cellValueFromDisplay(null)).toBe("");
  });

  it("empty cells use placeholder in DOM but read as empty string", () => {
    expect(cellValueForDisplay("")).toBe(TABLE_CELL_EMPTY_PLACEHOLDER);
    expect(cellValueFromDisplay(TABLE_CELL_EMPTY_PLACEHOLDER)).toBe("");

    const window = new Window();
    globalThis.document = window.document;
    const table = window.document.createElement("table");
    updateTableBody(table, [["a", ""], ["", "b"]]);
    const emptyTd = table.querySelector("td[data-table-col='1']") as HTMLTableCellElement;
    expect(emptyTd.textContent).toBe(TABLE_CELL_EMPTY_PLACEHOLDER);
    expect(readTableRows(table)).toEqual([["a", ""], ["", "b"]]);
  });

  it("readTableRows treats null textContent as empty", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = window.document.createElement("table");
    updateTableBody(table, [["a"]]);
    const td = table.querySelector("td") as HTMLTableCellElement;
    Object.defineProperty(td, "textContent", { value: null, configurable: true });
    expect(readTableRows(table)).toEqual([[""]]);
  });

  it("updateTableBody treats undefined cell values as empty", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = window.document.createElement("table");
    updateTableBody(table, [["filled", undefined as unknown as string]]);
    const cells = table.querySelectorAll("td");
    expect(cells[0]?.textContent).toBe("filled");
    expect(cells[1]?.textContent).toBe(TABLE_CELL_EMPTY_PLACEHOLDER);
  });

  it("toggles table edit mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const table = createTableElement(block);

    setTableEditable(table, false);
    expect(table.classList.contains("is-view-mode")).toBe(true);
    setTableEditable(table, true);
    expect(table.classList.contains("is-structure-mode")).toBe(true);
  });

  it("updates table body", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = window.document.createElement("table");
    updateTableBody(table, [["1", "2"]]);

    expect(table.querySelectorAll("td")).toHaveLength(2);
  });

  it("rebuilds table with column and row selectors", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = window.document.createElement("table");
    updateTableBody(table, [["1", "2"]]);

    expect(table.querySelector("thead")).not.toBeNull();
    expect(table.querySelectorAll(".table-col-select")).toHaveLength(2);
    expect(table.querySelectorAll(".table-row-select")).toHaveLength(1);
    expect(table.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("normalizes empty rows on create", () => {
    const block = createTableBlockFromRows([], {
      pageId: "page-1",
      languageId: "lang-pt",
    });

    expect(block.content.rows.length).toBeGreaterThan(0);
  });

  it("creates table block fallback when rows are missing", () => {
    const block = createTableBlockFromRows(null, {
      pageId: "page-1",
      languageId: "lang-pt",
    });

    expect(block.content.rows.length).toBeGreaterThan(0);
  });

  it("syncTableElementWithBlock supports legacy boolean editing flag", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["v"]] } };
    const table = window.document.createElement("table");
    syncTableElementWithBlock(table, block, true);
    expect(table.classList.contains("is-structure-mode")).toBe(true);
  });

  it("syncTableElementWithBlock uses linked visual rows and merges", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = createLinkedTableBlockFromRows(
      [["1"]],
      { filePath: "p", sheetName: "s", range: "A1:A1" },
      { merges: [{ r: 0, c: 0, rowspan: 1, colspan: 1 }] },
    );
    const table = window.document.createElement("table");
    syncTableElementWithBlock(table, block, { mode: "view", edit: null });
    expect(table.querySelectorAll("td").length).toBe(1);
  });

  it("syncTableElementWithBlock uses plain merges array when present", () => {
    const window = new Window();
    globalThis.document = window.document;

    const merge = { r: 0, c: 0, rowspan: 1, colspan: 1 };
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: { rows: [["v"]], merges: [merge] },
    };
    const table = window.document.createElement("table");
    syncTableElementWithBlock(table, block, { mode: "view", edit: null });
    expect(table.querySelector("td")).toBeTruthy();
  });

  it("syncTableElementWithBlock handles table block without content", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = window.document.createElement("table");
    syncTableElementWithBlock(table, { type: BLOCK_TYPES.TABLE }, { mode: "view", edit: null });
    expect(table.querySelectorAll("td").length).toBeGreaterThan(0);
  });

  it("syncTableElementWithBlock uses empty merges when not an array", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["v"]], merges: null } };
    const table = window.document.createElement("table");
    syncTableElementWithBlock(table, block, { mode: "view", edit: null });
    expect(table.querySelectorAll("td").length).toBe(1);
  });

  it("syncTableElementWithBlock forwards rowHeights to updateTableBody", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["v"]], rowHeights: [18] } };
    const table = window.document.createElement("table");
    syncTableElementWithBlock(table, block, { mode: "view", edit: null });
    expect(table.querySelectorAll("td").length).toBe(1);
  });

  it("creates table element with fallback rows", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {};
    const table = createTableElement(block);

    expect(table.querySelectorAll("td").length).toBeGreaterThan(0);
  });

  it("updates rows when block content is missing", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {};
    const table = createTableElement(block);

    table.dispatchEvent(new window.Event("input"));

    expect(block.content.rows.length).toBeGreaterThan(0);
  });

  it("linked table does not import excel rowHeights or cellStyles at creation", () => {
    const b = createLinkedTableBlockFromRows([["a"]], { filePath: "p", sheetName: "s", range: "A1:A1" }, {
      rowHeights: [11],
      cellStyles: { "0,0": { fontWeight: "bold" } },
    });
    expect(b.content.rowHeights).toBeUndefined();
    expect(b.content.cellStyles).toEqual({});
  });

  it("linked table keeps editor cellStyles on content", () => {
    const b = createLinkedTableBlockFromRows([["b"]], { filePath: "p", sheetName: "s", range: "A1:A1" }, {});
    b.content.cellStyles = { "0,0": { fontWeight: "bold" } };
    expect(b.content.cellStyles?.["0,0"]?.fontWeight).toBe("bold");
  });

  it("updateTableBody clears table font size when font scale is 1", () => {
    const table = document.createElement("table");
    table.style.fontSize = "40px";
    updateTableBody(table, [["x"]], [], null, null, { fontScale: 1 });
    expect(table.style.fontSize).toBe("");
  });

  it("updateTableBody applies base table font size when font scale is not 1", () => {
    const table = document.createElement("table");
    updateTableBody(table, [["x"]], [], null, null, { fontScale: 2 });
    expect(table.style.fontSize).toBe("28px");
  });

  it("updateTableBody scales per-cell font when font scale is not 1", () => {
    const table = document.createElement("table");
    updateTableBody(
      table,
      [["x"]],
      [],
      { cellStyles: { "0,0": { fontSize: "10pt" } } },
      null,
      { fontScale: 2 },
    );
    const td = table.querySelector("td");
    expect(td?.getAttribute("style")).toContain("20pt");
  });

  it("updateTableBody leaves cell font unscaled when font scale is 1", () => {
    const table = document.createElement("table");
    updateTableBody(
      table,
      [["x"]],
      [],
      { cellStyles: { "0,0": { fontSize: "10pt" } } },
      null,
      { fontScale: 1 },
    );
    const td = table.querySelector("td");
    expect(td?.getAttribute("style")).toContain("10pt");
  });
});
