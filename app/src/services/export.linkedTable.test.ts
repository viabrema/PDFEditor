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

  it("renders colspan for linked table merges", () => {
    const html = renderDocumentToHtml({
      title: "Linked",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "b1",
              type: "linkedTable",
              position: { x: 0, y: 0 },
              size: { width: 200, height: 80 },
              content: {
                rows: [["wide", ""]],
                merges: [{ r: 0, c: 0, rowspan: 1, colspan: 2 }],
              },
              metadata: { excelLink: { filePath: "C:\\f.xlsx", sheetName: "S", range: "A1:B1" } },
            },
          ],
        },
      ],
    });
    expect(html).toContain('colspan="2"');
    expect(html).toContain("wide");
    expect(html.match(/<td/g)?.length).toBe(1);
  });

  it("renders rowspan when only vertical merge", () => {
    const html = renderDocumentToHtml({
      title: "Linked",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "b2",
              type: "linkedTable",
              position: { x: 0, y: 0 },
              size: { width: 200, height: 80 },
              content: {
                rows: [["tall"], [""]],
                merges: [{ r: 0, c: 0, rowspan: 2, colspan: 1 }],
              },
              metadata: { excelLink: { filePath: "C:\\f.xlsx", sheetName: "S", range: "A1:A2" } },
            },
          ],
        },
      ],
    });
    expect(html).toContain('rowspan="2"');
    expect(html).not.toMatch(/colspan="/);
  });
});
