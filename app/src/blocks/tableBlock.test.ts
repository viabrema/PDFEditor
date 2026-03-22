import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { BLOCK_TYPES } from "./blockModel";
import {
  attachTableHandlers,
  computeTableSize,
  createEmptyTable,
  createLinkedTableBlockFromRows,
  createTableBlockFromRows,
  createTableBlockFromText,
  createTableElement,
  normalizeRows,
  parseTabularText,
  readTableRows,
  setTableEditable,
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

  it("normalizes row lengths", () => {
    const rows = normalizeRows([["a"], ["1", "2"]]);
    expect(rows).toEqual([["a", ""], ["1", "2"]]);
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
    expect(block.content.rows.length).toBeGreaterThan(0);
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
    expect(block.content.rows).toEqual([["a", "b"]]);
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

  it("toggles table edit mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const table = createTableElement(block);

    setTableEditable(table, false);
    expect(table.classList.contains("is-readonly")).toBe(true);
    setTableEditable(table, true);
    expect(table.classList.contains("is-editing")).toBe(true);
  });

  it("updates table body", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = window.document.createElement("table");
    updateTableBody(table, [["1", "2"]]);

    expect(table.querySelectorAll("td")).toHaveLength(2);
  });

  it("updates existing tbody", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = window.document.createElement("table");
    table.appendChild(window.document.createElement("tbody"));
    updateTableBody(table, [["1"]]);

    expect(table.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("handles paste with tabular data", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);
    const preventDefault = vi.fn();

    const event = new window.Event("paste");
    event.clipboardData = {
      getData: () => "a\tb\n1\t2",
    };
    event.preventDefault = preventDefault;

    table.dispatchEvent(event);

    const rows = readTableRows(table);
    expect(rows).toEqual([["a", "b"], ["1", "2"]]);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("ignores paste without tabular data", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);
    const preventDefault = vi.fn();

    const event = new window.Event("paste");
    event.clipboardData = {
      getData: () => "just text",
    };
    event.preventDefault = preventDefault;

    table.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("updates rows on input", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);
    const cell = table.querySelector("td");

    cell.textContent = "updated";
    table.dispatchEvent(new window.Event("input"));

    expect(block.content.rows).toEqual([["updated"]]);
  });

  it("normalizes empty rows on create", () => {
    const block = createTableBlockFromRows([], {
      pageId: "page-1",
      languageId: "lang-pt",
    });

    expect(block.content.rows.length).toBeGreaterThan(0);
  });

  it("attachTableHandlers uses existing content", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const table = window.document.createElement("table");
    updateTableBody(table, [["a"]]);

    attachTableHandlers({ table, block });
    table.dispatchEvent(new window.Event("input"));

    expect(block.content.rows).toEqual([["a"]]);
  });

  it("normalizes invalid rows to empty", () => {
    expect(normalizeRows(null)).toEqual([]);
  });

  it("creates table block fallback when rows are missing", () => {
    const block = createTableBlockFromRows(null, {
      pageId: "page-1",
      languageId: "lang-pt",
    });

    expect(block.content.rows.length).toBeGreaterThan(0);
  });

  it("uses empty table when paste has no data", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);
    const preventDefault = vi.fn();

    const event = new window.Event("paste");
    event.clipboardData = {
      getData: () => "",
    };
    event.preventDefault = preventDefault;

    table.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("handles paste with newline data", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);
    const preventDefault = vi.fn();

    const event = new window.Event("paste");
    event.clipboardData = {
      getData: () => "a\n1",
    };
    event.preventDefault = preventDefault;

    table.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("uses empty table when paste is only whitespace", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);
    const preventDefault = vi.fn();

    const event = new window.Event("paste");
    event.clipboardData = {
      getData: () => " \n ",
    };
    event.preventDefault = preventDefault;

    table.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(readTableRows(table).length).toBeGreaterThan(0);
  });

  it("ignores paste without clipboard data", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);

    const event = new window.Event("paste");
    table.dispatchEvent(event);

    expect(readTableRows(table)).toEqual([["x"]]);
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
});
