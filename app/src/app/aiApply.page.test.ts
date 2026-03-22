import { describe, expect, it } from "vitest";
import { applyAiResultToPage } from "./aiApply";

describe("applyAiResultToPage", () => {
  const documentData = {
    pages: [{ id: "page-1", name: "P1" }, { id: "page-2", name: "P2" }],
  };

  it("moves block to another page when update includes valid pageId", () => {
    const blocks = [
      {
        id: "a",
        type: "text",
        pageId: "page-1",
        content: { type: "doc", content: [] },
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      },
    ];
    const state = { activePageId: "page-1", activeLanguageId: "lang-pt" };
    const ok = applyAiResultToPage({
      resultText: JSON.stringify({
        actions: [{ type: "update", id: "a", pageId: "page-2" }],
      }),
      blocks,
      state,
      documentData,
    });
    expect(ok).toBe(true);
    expect(blocks[0].pageId).toBe("page-2");
  });

  it("creates table when IA uses content instead of tableRows", () => {
    const blocks: any[] = [];
    const state = { activePageId: "page-1", activeLanguageId: "lang-pt" };
    const ok = applyAiResultToPage({
      resultText: JSON.stringify({
        actions: [
          {
            type: "create",
            blockType: "table",
            content: [
              ["A", "B"],
              ["1", "2"],
            ],
            position: { x: 30, y: 30 },
            size: { width: 150, height: 120 },
          },
        ],
      }),
      blocks,
      state,
      documentData,
    });
    expect(ok).toBe(true);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("table");
    expect(blocks[0].content.rows).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
    expect(blocks[0].pageId).toBe("page-1");
  });

  it("creates image block with imageSrc", () => {
    const blocks: any[] = [];
    const state = { activePageId: "page-1", activeLanguageId: "lang-pt" };
    const ok = applyAiResultToPage({
      resultText: JSON.stringify({
        actions: [
          {
            type: "create",
            blockType: "image",
            imageSrc: "https://example.com/x.png",
            position: { x: 10, y: 10 },
            size: { width: 120, height: 80 },
          },
        ],
      }),
      blocks,
      state,
      documentData,
    });
    expect(ok).toBe(true);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("image");
    expect(blocks[0].content.src).toContain("example.com");
  });
});
