import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export";

describe("export service (linked table)", () => {
  it("renders linked table block as table markup", () => {
    const html = renderDocumentToHtml({
      title: "Linked",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-linked",
              type: "linkedTable",
              position: { x: 10, y: 10 },
              size: { width: 200, height: 80 },
              content: { rows: [["L1", "L2"]] },
              metadata: {
                excelLink: {
                  filePath: "C:\\f.xlsx",
                  sheetName: "S1",
                  range: "A1:B1",
                },
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("block-linked");
    expect(html).toContain("table-block-export-clip");
    expect(html).toContain("<table>");
    expect(html).toContain("L1");
  });
});
