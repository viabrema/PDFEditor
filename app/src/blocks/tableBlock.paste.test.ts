import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { BLOCK_TYPES } from "./blockModel";
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

  it("linked table input updates dataSourceRows in typing cell", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["x"]] },
    };
    const table = createTableElement(block);
    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    }, { block });
    const cell = table.querySelector("td.is-typing-cell") as HTMLTableCellElement;
    cell.textContent = "raw-value";
    table.dispatchEvent(new window.Event("input"));

    expect(block.content.dataSourceRows).toEqual([["raw-value"]]);
  });

  it("linked table paste in view mode refreshes body", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["a"]] },
    };
    const table = createTableElement(block, { readOnly: false });
    const event = new window.Event("paste");
    event.clipboardData = { getData: () => "v\tw" };
    event.preventDefault = vi.fn();
    table.dispatchEvent(event);
    expect(block.content.dataSourceRows).toEqual([["v", "w"]]);
  });

  it("linked table paste in structure mode refreshes body", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["a"]] },
    };
    const table = createTableElement(block);
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    }, { block });
    const event = new window.Event("paste");
    event.clipboardData = { getData: () => "z\tw" };
    event.preventDefault = vi.fn();
    table.dispatchEvent(event);
    expect(block.content.dataSourceRows).toEqual([["z", "w"]]);
  });

  it("linked table paste in cell-type mode refreshes body", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["a"]] },
    };
    const table = createTableElement(block);
    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    }, { block });
    const event = new window.Event("paste");
    event.clipboardData = { getData: () => "p\tq" };
    event.preventDefault = vi.fn();
    table.dispatchEvent(event);
    expect(block.content.dataSourceRows).toEqual([["p", "q"]]);
  });

  it("linked table paste replaces dataSourceRows", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["old"]] },
    };
    const table = createTableElement(block);
    const event = new window.Event("paste");
    event.clipboardData = { getData: () => "n1\tn2" };
    event.preventDefault = vi.fn();
    table.dispatchEvent(event);

    expect(block.content.dataSourceRows).toEqual([["n1", "n2"]]);
  });

  it("linked table input no-op without typing cell", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["x"]] },
    };
    const table = createTableElement(block);
    table.dispatchEvent(new window.Event("input"));
    expect(block.content.dataSourceRows).toEqual([["x"]]);
  });

  it("linked table input ignores invalid row index", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["x"]] },
    };
    const table = createTableElement(block);
    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    }, { block });
    const cell = table.querySelector("td.is-typing-cell") as HTMLTableCellElement;
    cell.dataset.tableRow = "nope";
    cell.dataset.tableCol = "0";
    table.dispatchEvent(new window.Event("input"));
    expect(block.content.dataSourceRows).toEqual([["x"]]);
  });

  it("linked table input ignores invalid column index", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["x"]] },
    };
    const table = createTableElement(block);
    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    }, { block });
    const cell = table.querySelector("td.is-typing-cell") as HTMLTableCellElement;
    expect(cell).toBeTruthy();
    cell.dataset.tableRow = "0";
    cell.dataset.tableCol = "not-a-number";
    table.dispatchEvent(new window.Event("input"));
    expect(block.content.dataSourceRows).toEqual([["x"]]);
    cell.dataset.tableCol = "0";
    cell.textContent = "y";
    table.dispatchEvent(new window.Event("input"));
    expect(block.content.dataSourceRows).toEqual([["y"]]);
  });

  it("linked table input ignores invalid cell coordinates", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["x"]] },
    };
    const table = createTableElement(block);
    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    }, { block });
    const cell = table.querySelector("td.is-typing-cell") as HTMLTableCellElement;
    delete cell.dataset.tableRow;
    delete cell.dataset.tableCol;
    table.dispatchEvent(new window.Event("input"));
    expect(block.content.dataSourceRows).toEqual([["x"]]);
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

  it("extends selection with shift+click on cells", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b"], ["c", "d"]] } };
    const change = vi.fn();
    const table = createTableElement(block, {
      getTableEdit: () => ({
        blockId: "b",
        scope: "cell",
        row: 0,
        col: 0,
        typing: false,
        anchor: { scope: "cell", row: 0, col: 0 },
      }),
      onTableEditChange: change,
    });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const cell = table.querySelector("td[data-table-row='1'][data-table-col='1']") as HTMLTableCellElement;
    cell.dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: true }),
    );

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({
        multi: expect.objectContaining({
          cells: expect.arrayContaining([
            expect.objectContaining({ row: 0, col: 0 }),
            expect.objectContaining({ row: 1, col: 1 }),
          ]),
        }),
      }),
    );
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

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "cell", row: 0, col: 1, typing: false }),
    );
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

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "column", row: 0, col: 1, typing: false }),
    );
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

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "cell", row: 0, col: 0, typing: true }),
    );
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

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "row", row: 1, col: 0, typing: false }),
    );
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
