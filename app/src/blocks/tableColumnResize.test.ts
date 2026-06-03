import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { attachTableColumnResize } from "./tableColumnResize";
import { updateTableBody } from "./tableBlockDomBuild";

describe("tableColumnResize", () => {
  it("drags resize handle and updates col widths", () => {
    const window = new Window();
    globalThis.document = window.document;

    const table = document.createElement("table");
    table.classList.add("is-structure-mode");
    updateTableBody(table, [["a", "b"]], [], null, null, { colWidths: [100, 100] });

    const widths: number[] = [100, 100];
    const onStart = vi.fn();
    const onEnd = vi.fn();
    attachTableColumnResize(table, {
      getColCount: () => 2,
      getColWidths: () => [...widths],
      setColWidths: (w) => {
        widths.splice(0, widths.length, ...w);
      },
      onResizeSessionStart: onStart,
      onResizeSessionEnd: onEnd,
    });

    const handle = table.querySelector(".table-col-resize-handle") as HTMLElement;
    handle.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true, clientX: 50, button: 0 }),
    );
    expect(onStart).toHaveBeenCalled();

    document.dispatchEvent(new window.MouseEvent("mousemove", { clientX: 80, button: 0 }));
    expect(widths[0]).toBeGreaterThan(100);

    document.dispatchEvent(new window.MouseEvent("mouseup", { button: 0 }));
    document.dispatchEvent(new window.MouseEvent("mouseup", { button: 0 }));
    expect(onEnd).toHaveBeenCalled();
    expect(table.classList.contains("is-col-resizing")).toBe(false);
  });

  it("ignores invalid handle and no-ops move/up without active resize", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    table.classList.add("is-structure-mode");
    updateTableBody(table, [["a"]]);
    const setColWidths = vi.fn();
    attachTableColumnResize(table, {
      getColCount: () => 1,
      getColWidths: () => [120],
      setColWidths,
    });
    document.dispatchEvent(new window.MouseEvent("mousemove", { clientX: 10 }));
    document.dispatchEvent(new window.MouseEvent("mouseup"));
    const handle = table.querySelector(".table-col-resize-handle") as HTMLElement;
    delete handle.dataset.tableCol;
    handle.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true, button: 0 }));
    expect(setColWidths).not.toHaveBeenCalled();
  });

  it("ignores non-primary button and clicks outside the handle", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    table.classList.add("is-structure-mode");
    updateTableBody(table, [["a"]]);
    const setColWidths = vi.fn();
    attachTableColumnResize(table, {
      getColCount: () => 1,
      getColWidths: () => [120],
      setColWidths,
    });
    table.dispatchEvent(new window.MouseEvent("mousedown", { button: 2, bubbles: true }));
    const th = table.querySelector(".table-col-select") as HTMLElement;
    th.dispatchEvent(new window.MouseEvent("mousedown", { button: 0, bubbles: true }));
    expect(setColWidths).not.toHaveBeenCalled();
  });

  it("ignores resize outside structure mode", () => {
    const window = new Window();
    globalThis.document = window.document;
    const table = document.createElement("table");
    updateTableBody(table, [["a"]]);
    const setColWidths = vi.fn();
    attachTableColumnResize(table, {
      getColCount: () => 1,
      getColWidths: () => [120],
      setColWidths,
    });
    const handle = table.querySelector(".table-col-resize-handle") as HTMLElement;
    handle.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true, button: 0 }));
    expect(setColWidths).not.toHaveBeenCalled();
  });
});
