import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export.js";

describe("export service (styles)", () => {
  it("renders default text block styles", () => {
    const html = renderDocumentToHtml({
      title: "Text",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-text",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 40 },
              content: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Oi" }] }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("font-size: 16px");
    expect(html).toContain("font-weight: 400");
    const blockStyleMatch = html.match(/class="block text-block" style="([^"]+)"/);
    expect(blockStyleMatch).not.toBeNull();
    expect(blockStyleMatch[1]).not.toContain("font-family:");
  });

  it("respects disabled header and footer regions", () => {
    const html = renderDocumentToHtml({
      title: "Regions",
      page: { format: "A4", orientation: "portrait" },
      regions: {
        header: {
          enabled: false,
          height: 40,
          blocks: [
            {
              id: "header-block",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 40 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Topo" }] },
                ],
              },
            },
          ],
        },
        footer: {
          enabled: false,
          height: 40,
          blocks: [
            {
              id: "footer-block",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 40 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Base" }] },
                ],
              },
            },
          ],
        },
      },
      pages: [
        {
          id: "page-1",
          blocks: [],
        },
      ],
    });

    expect(html).not.toContain("header-block");
    expect(html).not.toContain("footer-block");
  });

  it("defaults to text when block type is missing", () => {
    const html = renderDocumentToHtml({
      title: "NoType",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-no-type",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Texto" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("text-block");
    expect(html).toContain("font-size: 16px");
  });
});
