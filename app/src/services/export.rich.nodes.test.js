import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export.js";

describe("export service (rich nodes)", () => {
  it("renders lists, hard breaks, and unknown marks", () => {
    const html = renderDocumentToHtml({
      title: "List",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-text",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 200, height: 120 },
              content: {
                type: "doc",
                content: [
                  {
                    type: "bullet_list",
                    content: [
                      {
                        type: "list_item",
                        content: [
                          {
                            type: "paragraph",
                            content: [
                              {
                                type: "text",
                                text: "Item",
                                marks: [{ type: "code" }],
                              },
                              { type: "hard_break" },
                              { type: "text", text: "2" },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: "ordered_list",
                    content: [
                      {
                        type: "list_item",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Ordenado" }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>");
    expect(html).toContain("<br />");
  });

  it("renders horizontal rule", () => {
    const html = renderDocumentToHtml({
      title: "HR",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-text",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 200, height: 80 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Topo" }] },
                  { type: "horizontal_rule" },
                  { type: "paragraph", content: [{ type: "text", text: "Base" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("<hr />");
  });

  it("renders chart node", () => {
    const html = renderDocumentToHtml({
      title: "Chart",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-text",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              content: { type: "chart" },
            },
          ],
        },
      ],
    });

    expect(html).toContain("pm-chart");
  });

  it("renders unknown nodes by children", () => {
    const html = renderDocumentToHtml({
      title: "Unknown",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-text",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              content: {
                type: "heading",
                content: [{ type: "text", text: "Titulo" }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("Titulo");
  });
});
