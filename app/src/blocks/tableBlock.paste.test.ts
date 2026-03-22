import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import {
  attachTableHandlers,
  createTableElement,
  readTableRows,
  updateTableBody,
} from "./tableBlock";

describe("table block paste and handlers", () => {
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

  it("updateTableBody omits style attribute when cell style maps to empty CSS", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = window.document.createElement("table");
    updateTableBody(table, [["z"]], [], { "0,0": {} as any });
    expect(table.querySelector("td")?.getAttribute("style")).toBeNull();
  });
});
