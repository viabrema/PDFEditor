import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import {
  applyTableDomMode,
  attachTableHandlers,
  createTableElement,
  readTableRows,
  syncTableElementWithBlock,
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

  it("ignores focusin outside typing cells", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const table = createTableElement(block);
    table.dispatchEvent(new window.Event("focusin", { bubbles: true }));
    expect(block.content.rows).toEqual([["a"]]);
  });

  it("strips br on focusin in typing cell", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [[""]] } };
    const table = createTableElement(block);
    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.innerHTML = "";
    cell.append(window.document.createElement("br"));
    cell.dispatchEvent(new window.Event("focusin", { bubbles: true }));

    expect(cell.querySelector("br")).toBeNull();
    expect(cell.textContent).toBe("\u00a0");
  });

  it("updates rows on input in cell-type mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["x"]] } };
    const table = createTableElement(block);
    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    });
    const cell = table.querySelector("td") as HTMLTableCellElement;

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

  it("notifies onTableEditChange when a cell is clicked in structure mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const cell = table.querySelector("td[data-table-col='1']") as HTMLTableCellElement;
    cell.click();

    expect(change).toHaveBeenCalledWith({ scope: "cell", row: 0, col: 1, typing: false });
  });

  it("notifies onTableEditChange when column header is clicked", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const colHead = table.querySelector(".table-col-select[data-table-col='1']") as HTMLElement;
    colHead.click();

    expect(change).toHaveBeenCalledWith({ scope: "column", row: 0, col: 1, typing: false });
  });

  it("enters typing on cell double-click in structure mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.dispatchEvent(new window.Event("dblclick", { bubbles: true }));

    expect(change).toHaveBeenCalledWith({ scope: "cell", row: 0, col: 0, typing: true });
  });

  it("notifies onTableEditChange when row header is clicked", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"], ["b"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const rowHead = table.querySelector(".table-row-select[data-table-row='1']") as HTMLElement;
    rowHead.click();

    expect(change).toHaveBeenCalledWith({ scope: "row", row: 1, col: 0, typing: false });
  });

  it("ignores double-click in view mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.dispatchEvent(new window.Event("dblclick", { bubbles: true }));

    expect(change).not.toHaveBeenCalled();
  });

  it("ignores double-click outside data cells", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const corner = table.querySelector(".table-select-corner") as HTMLElement;
    corner.dispatchEvent(new window.Event("dblclick", { bubbles: true }));

    expect(change).not.toHaveBeenCalled();
  });

  it("ignores cell click when indices are invalid", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.dataset.tableRow = "x";
    cell.dataset.tableCol = "y";
    cell.click();

    expect(change).not.toHaveBeenCalled();
  });

  it("ignores cell double-click when indices are invalid", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.dataset.tableRow = "nope";
    cell.dataset.tableCol = "nope";
    cell.dispatchEvent(new window.Event("dblclick", { bubbles: true }));

    expect(change).not.toHaveBeenCalled();
  });

  it("syncTableElementWithBlock accepts legacy boolean editing flag", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = window.document.createElement("table");
    const block = { content: { rows: [["a"]] } };
    syncTableElementWithBlock(table, block, true);
    expect(table.classList.contains("is-structure-mode")).toBe(true);
    syncTableElementWithBlock(table, block, false);
    expect(table.classList.contains("is-view-mode")).toBe(true);
  });

  it("ignores clicks on non-data targets in structure mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    table.querySelector("thead")?.click();

    expect(change).not.toHaveBeenCalled();
  });

  it("ignores clicks when in view mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.click();

    expect(change).not.toHaveBeenCalled();
  });

  it("paste with empty tabular text recreates default table", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {};
    const table = createTableElement(block);
    const event = new window.Event("paste", { bubbles: true });
    Object.defineProperty(event, "clipboardData", {
      value: { getData: () => "\n" },
    });
    table.dispatchEvent(event);

    expect(readTableRows(table).length).toBeGreaterThan(0);
    expect(block.content?.rows?.length).toBeGreaterThan(0);
  });

  it("updateTableBody skips style attribute when css is empty", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = window.document.createElement("table");
    updateTableBody(table, [["z"]], [], {
      cellStyles: { "0,0": { numberFormat: { kind: "general", decimals: 0, locale: "pt-BR" } } },
    });
    expect(table.querySelector("td")?.hasAttribute("style")).toBe(false);
  });

  it("updateTableBody omits style attribute when cell style maps to empty CSS", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = window.document.createElement("table");
    updateTableBody(table, [["z"]], [], { cellStyles: { "0,0": {} } });
    expect(table.querySelector("td")?.getAttribute("style")).toBeNull();
  });
});
