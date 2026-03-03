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

  it("renders heading with alignment", () => {
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
                attrs: { level: 1, textAlign: "center" },
                content: [{ type: "text", text: "Titulo" }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("<h1");
    expect(html).toContain("text-align: center");
    expect(html).toContain("Titulo");
  });

  it("renders paragraph alignment", () => {
    const html = renderDocumentToHtml({
      title: "Align",
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
                type: "paragraph",
                attrs: { textAlign: "right" },
                content: [{ type: "text", text: "Texto" }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("text-align: right");
  });

  it("renders heading without alignment", () => {
    const html = renderDocumentToHtml({
      title: "Heading",
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
                attrs: { level: 2 },
                content: [{ type: "text", text: "Titulo" }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("<h2>");
  });

  it("renders heading without attrs", () => {
    const html = renderDocumentToHtml({
      title: "Heading",
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

    expect(html).toContain("<h1>");
  });

  it("renders unknown node fallback", () => {
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
                type: "unknown",
                content: [{ type: "text", text: "Fallback" }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("Fallback");
  });
});
