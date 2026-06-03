import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "./blockModel";
import { attachTableHandlers, updateTableBody } from "./tableBlockDom";

describe("tableBlockDom linked input", () => {
  it("ignores input when column index is not finite", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["x"]] },
    };
    const table = window.document.createElement("table");
    updateTableBody(table, [["x"]]);
    attachTableHandlers({ table, block });

    const td = window.document.createElement("td");
    td.className = "is-typing-cell";
    td.dataset.tableRow = "0";
    td.dataset.tableCol = "invalid";
    table.querySelector("tbody tr")?.append(td);

    td.textContent = "changed";
    table.dispatchEvent(new window.Event("input"));

    expect(block.content.dataSourceRows).toEqual([["x"]]);
  });
});
