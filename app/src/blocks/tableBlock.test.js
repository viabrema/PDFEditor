import { describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import {
  attachTableHandlers,
  computeTableSize,
  createEmptyTable,
  createTableBlockFromRows,
  createTableBlockFromText,
  createTableElement,
  normalizeRows,
  parseTabularText,
  readTableRows,
  updateTableBody,
} from "./tableBlock.js";

describe("table block", () => {
  it("parses tabular text", () => {
    const rows = parseTabularText("a\tb\n1\t2");
    expect(rows).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("returns empty rows for empty text", () => {
    expect(parseTabularText("")).toEqual([]);
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

  it("updates table body", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = window.document.createElement("table");
    updateTableBody(table, [["1", "2"]]);

    expect(table.querySelectorAll("td")).toHaveLength(2);
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
});
