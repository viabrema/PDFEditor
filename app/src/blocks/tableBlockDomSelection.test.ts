import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { applyTableDomMode } from "./tableBlockInteraction";
import { attachTableStructureSelection } from "./tableBlockDomSelection";
import { createTableElement } from "./tableBlockDom";

describe("attachTableStructureSelection", () => {
  it("drags a rectangle of cells in structure mode", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b"], ["c", "d"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    attachTableStructureSelection(table, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });

    const start = table.querySelector("td[data-table-row='0'][data-table-col='0']") as HTMLTableCellElement;
    const end = table.querySelector("td[data-table-row='1'][data-table-col='1']") as HTMLTableCellElement;
    const startRect = { left: 0, top: 0, right: 40, bottom: 20, width: 40, height: 20 };
    start.getBoundingClientRect = () => startRect as DOMRect;
    end.getBoundingClientRect = () => ({ left: 50, top: 30, right: 90, bottom: 50, width: 40, height: 20 }) as DOMRect;
    vi.spyOn(document, "elementFromPoint").mockImplementation((x, y) => {
      if (x >= 50) {
        return end;
      }
      return start;
    });

    start.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }),
    );
    document.dispatchEvent(
      new window.MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 60, clientY: 40 }),
    );
    document.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true }));

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({
        multi: expect.objectContaining({ cells: expect.any(Array) }),
      }),
    );
    expect(table.classList.contains("is-table-dragging")).toBe(false);
  });

  it("drags multiple rows from row header", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a"], ["b"], ["c"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    attachTableStructureSelection(table, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "row",
      row: 0,
      col: 0,
      typing: false,
    });

    const row0 = table.querySelector(".table-row-select[data-table-row='0']") as HTMLElement;
    const row2 = table.querySelector("td[data-table-row='2']") as HTMLTableCellElement;
    vi.spyOn(document, "elementFromPoint").mockReturnValue(row2);

    row0.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new window.MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 10, clientY: 80 }),
    );
    document.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true }));

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ multi: expect.objectContaining({ rows: [0, 1, 2] }) }),
    );
  });

  it("suppresses click after drag and supports ctrl+click on column", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b"]] } };
    const change = vi.fn();
    let edit: any = {
      blockId: "b",
      scope: "column",
      row: 0,
      col: 0,
      typing: false,
      anchor: { scope: "column", row: 0, col: 0 },
    };
    const table = createTableElement(block, {
      getTableEdit: () => edit,
      onTableEditChange: (patch) => {
        edit = { blockId: "b", ...patch };
        change(patch);
      },
    });
    attachTableStructureSelection(table, {
      getTableEdit: () => edit,
      onTableEditChange: (patch) => {
        edit = { blockId: "b", ...patch };
        change(patch);
      },
    });
    applyTableDomMode(table, "structure", edit);

    const col1 = table.querySelector(".table-col-select[data-table-col='1']") as HTMLElement;
    col1.dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }),
    );
    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ multi: expect.objectContaining({ cols: [0, 1] }) }),
    );
  });

  it("drags across columns from header", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b", "c"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    attachTableStructureSelection(table, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "column",
      row: 0,
      col: 0,
      typing: false,
    });

    const col0 = table.querySelector(".table-col-select[data-table-col='0']") as HTMLElement;
    const col2 = table.querySelector(".table-col-select[data-table-col='2']") as HTMLElement;
    vi.spyOn(document, "elementFromPoint").mockReturnValue(col2);

    col0.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new window.MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 100, clientY: 0 }),
    );
    document.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true }));

    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ multi: expect.objectContaining({ cols: [0, 1, 2] }) }),
    );
  });

  it("suppresses click after an active drag", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["a", "b"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    attachTableStructureSelection(table, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });

    const start = table.querySelector("td[data-table-row='0'][data-table-col='0']") as HTMLTableCellElement;
    const end = table.querySelector("td[data-table-row='0'][data-table-col='1']") as HTMLTableCellElement;
    vi.spyOn(document, "elementFromPoint").mockImplementation((x) => (x > 20 ? end : start));

    start.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new window.MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 50, clientY: 0 }),
    );
    document.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true }));
    const callsAfterDrag = change.mock.calls.length;
    end.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(change.mock.calls.length).toBe(callsAfterDrag);
  });

  it("ignores mousedown with modifiers and non-primary button", () => {
    const window = new Window();
    globalThis.document = window.document;
    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    attachTableStructureSelection(table, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, button: 2, clientX: 0, clientY: 0 }),
    );
    cell.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, shiftKey: true, clientX: 0, clientY: 0 }),
    );
    expect(change).not.toHaveBeenCalled();
  });

  it("skips drag setup in view mode, typing cell, or modified mousedown", () => {
    const window = new Window();
    globalThis.document = window.document;
    const block = { content: { rows: [["a", "b"], ["c", "d"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    attachTableStructureSelection(table, { onTableEditChange: change });

    applyTableDomMode(table, "view", null);
    const cell = table.querySelector("td") as HTMLTableCellElement;
    cell.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
    );

    applyTableDomMode(table, "cell-type", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: true,
    });
    const typing = table.querySelector(".is-typing-cell") as HTMLTableCellElement;
    typing.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
    );

    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "row",
      row: 0,
      col: 0,
      typing: false,
    });
    const rowHead = table.querySelector(".table-row-select[data-table-row='1']") as HTMLElement;
    rowHead.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, shiftKey: true, clientX: 0, clientY: 0 }),
    );
    const colHead = table.querySelector(".table-col-select[data-table-col='1']") as HTMLElement;
    colHead.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, ctrlKey: true, clientX: 0, clientY: 0 }),
    );
    expect(change).not.toHaveBeenCalled();
  });

  it("waits for drag threshold before applying selection", () => {
    const window = new Window();
    globalThis.document = window.document;
    const block = { content: { rows: [["a"]] } };
    const change = vi.fn();
    const table = createTableElement(block, { onTableEditChange: change });
    attachTableStructureSelection(table, { onTableEditChange: change });
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });

    const start = table.querySelector("td") as HTMLTableCellElement;
    const bad = document.createElement("td");
    bad.dataset.tableRow = "nope";
    bad.dataset.tableCol = "0";
    table.querySelector("tbody tr")?.append(bad);

    let moveCount = 0;
    vi.spyOn(document, "elementFromPoint").mockImplementation(() => {
      moveCount += 1;
      if (moveCount === 1) {
        return bad;
      }
      return start;
    });

    start.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new window.MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 2, clientY: 0 }),
    );
    document.dispatchEvent(
      new window.MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 40, clientY: 0 }),
    );
    document.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true }));
    expect(change).toHaveBeenCalled();
  });

  it("drag without change handler does not throw", () => {
    const window = new Window();
    globalThis.document = window.document;
    const block = { content: { rows: [["a"]] } };
    const table = createTableElement(block);
    attachTableStructureSelection(table, {});
    applyTableDomMode(table, "structure", {
      blockId: "b",
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
    });
    const cell = table.querySelector("td") as HTMLTableCellElement;
    vi.spyOn(document, "elementFromPoint").mockReturnValue(cell);
    cell.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new window.MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }),
    );
    document.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true }));
  });
});
