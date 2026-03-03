import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export.js";

describe("export service (rich)", () => {
  it("escapes text content", () => {
    const html = renderDocumentToHtml({
      title: "Esc",
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
                content: [{ type: "text", text: "<b>&\"" }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("&lt;b&gt;&amp;&quot;");
  });

  it("renders bold and italic marks", () => {
    const html = renderDocumentToHtml({
      title: "Marks",
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
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Oi",
                        marks: [{ type: "strong" }, { type: "em" }],
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

    expect(html).toContain("<strong><em>Oi</em></strong>");
  });

  it("renders font size and family marks", () => {
    const html = renderDocumentToHtml({
      title: "Font",
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
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Oi",
                        marks: [
                          { type: "textStyle", attrs: { fontSize: "18px" } },
                          { type: "textStyle", attrs: { fontFamily: "Georgia" } },
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

    expect(html).toContain("font-size: 18px");
    expect(html).toContain("font-family: Georgia");
  });

  it("sanitizes text style values", () => {
    const html = renderDocumentToHtml({
      title: "Sanitize",
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
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Oi",
                        marks: [
                          {
                            type: "textStyle",
                            attrs: { fontFamily: "Georgia\";color:red" },
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

    expect(html).toContain("font-family: Georgiacolor:red");
  });

  it("renders text without empty style", () => {
    const html = renderDocumentToHtml({
      title: "EmptyStyle",
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
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Oi",
                        marks: [{ type: "textStyle", attrs: {} }],
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

    expect(html).not.toContain("<span style=");
  });

  it("renders title and subtitle styles", () => {
    const html = renderDocumentToHtml({
      title: "Styles",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-title",
              type: "title",
              position: { x: 0, y: 0 },
              size: { width: 200, height: 100 },
              metadata: { align: "center" },
              content: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Oi" }] }],
              },
            },
            {
              id: "block-subtitle",
              type: "subtitle",
              position: { x: 0, y: 120 },
              size: { width: 200, height: 100 },
              metadata: { fontFamily: "Georgia", fontSize: "20px" },
              content: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Ola" }] }],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("font-size: 26px");
    expect(html).toContain("text-align: center");
    expect(html).toContain("font-family: Georgia");
    expect(html).toContain("font-size: 20px");
  });
});
