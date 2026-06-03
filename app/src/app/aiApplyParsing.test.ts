import { describe, expect, it } from "vitest";
import { balanceJsonBrackets, parseAiJson } from "./aiApplyParsing";
import { applyAiResultToPage } from "./aiApply";

describe("parseAiJson", () => {
  it("balances truncated actions JSON from IA", () => {
    const truncated =
      '{"actions":[{"type":"update","id":"tbl","tableFormat":[{"scope":"row","row":0,"style":{"backgroundColor":"#f0f0f0"}}]}';
    const parsed = parseAiJson(truncated);
    expect(parsed?.actions?.[0]?.tableFormat?.[0]?.row).toBe(0);
  });

  it("balanceJsonBrackets closes open arrays and objects", () => {
    expect(balanceJsonBrackets('{"a":[1')).toBe('{"a":[1]}');
  });
});

describe("parseAiJson tableFormat apply", () => {
  const documentData = { pages: [{ id: "p1", name: "P1" }] };

  it("applies tableFormat array for institutional row styles", () => {
    const blocks = [
      {
        id: "tbl",
        type: "linkedTable",
        pageId: "p1",
        content: {
          dataSourceRows: [
            ["H", "A", "B"],
            ["1", "2", "3"],
            ["4", "5", "6"],
          ],
          cellStyles: {},
          rowStyles: {},
          colStyles: {},
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 200 },
      },
    ];
    const payload = JSON.stringify({
      actions: [
        {
          type: "update",
          id: "tbl",
          tableFormat: [
            { scope: "row", row: 0, style: { backgroundColor: "#f0f0f0", fontWeight: "bold" } },
            { scope: "row", row: 1, style: { backgroundColor: "#d9edf7" } },
            { scope: "row", row: 2, style: { backgroundColor: "#ffffff" } },
          ],
        },
      ],
    });
    const ok = applyAiResultToPage({
      resultText: payload,
      blocks,
      state: { activePageId: "p1", activeLanguageId: "lang" },
      documentData,
    });
    expect(ok).toBe(true);
    expect(blocks[0].content.rowStyles?.["0"]?.backgroundColor).toBe("#f0f0f0");
    expect(blocks[0].content.rowStyles?.["0"]?.fontWeight).toBe("bold");
    expect(blocks[0].content.rowStyles?.["1"]?.backgroundColor).toBe("#d9edf7");
  });
});
