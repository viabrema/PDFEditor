import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export.js";

describe("export service (basic)", () => {
  it("renders basic HTML", () => {
    const document = {
      title: "Demo",
      page: { format: "A4", orientation: "portrait" },
      pages: [{ id: "page-1", name: "Page 1", blocks: [] }],
    };

    const html = renderDocumentToHtml(document);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Demo");
    expect(html).toContain("data-page-id=\"page-1\"");
  });

  it("handles empty documents", () => {
    const html = renderDocumentToHtml({ pages: [] });

    expect(html).toContain("Documento");
    expect(html).toContain("<main class=\"document\">");
  });

  it("uses a default page name", () => {
    const html = renderDocumentToHtml({
      title: "No Name",
      pages: [{ id: "page-2", blocks: [] }],
    });

    expect(html).toContain("data-page-id=\"page-2\"");
  });

  it("handles missing document", () => {
    const html = renderDocumentToHtml();

    expect(html).toContain("Document");
  });

  it("renders blocks", () => {
    const html = renderDocumentToHtml({
      title: "Blocks",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-text",
              type: "text",
              position: { x: 10, y: 20 },
              size: { width: 200, height: 100 },
              content: { type: "doc", content: [{ type: "text", text: "Ola" }] },
            },
            {
              id: "block-image",
              type: "image",
              position: { x: 20, y: 30 },
              size: { width: 200, height: 100 },
              content: { src: "data:image/png;base64,abc" },
            },
            {
              id: "block-table",
              type: "table",
              position: { x: 30, y: 40 },
              size: { width: 200, height: 100 },
              content: { rows: [["A", "B"]] },
            },
          ],
        },
      ],
    });

    expect(html).toContain("block-text");
    expect(html).toContain("data:image/png");
    expect(html).toContain("<table>");
  });

  it("renders header and footer blocks", () => {
    const html = renderDocumentToHtml({
      title: "Regions",
      page: { format: "A4", orientation: "portrait" },
      regions: {
        header: {
          enabled: true,
          height: 100,
          blocks: [
            {
              id: "block-header",
              type: "text",
              position: { x: 10, y: 10 },
              size: { width: 120, height: 40 },
              content: { type: "doc", content: [{ type: "text", text: "Topo" }] },
            },
          ],
        },
        footer: {
          enabled: true,
          height: 80,
          blocks: [
            {
              id: "block-footer",
              type: "text",
              position: { x: 20, y: 10 },
              size: { width: 120, height: 40 },
              content: { type: "doc", content: [{ type: "text", text: "Base" }] },
            },
          ],
        },
      },
      pages: [{ id: "page-1", blocks: [] }],
    });

    expect(html).toContain("block-header");
    expect(html).toContain("top:10px");
    expect(html).toContain("block-footer");
    expect(html).toContain("top:1053px");
  });

  it("skips disabled header and footer", () => {
    const html = renderDocumentToHtml({
      title: "Regions",
      page: { format: "A4", orientation: "portrait" },
      regions: {
        header: {
          enabled: false,
          height: 100,
          blocks: [
            {
              id: "block-header",
              type: "text",
              position: { x: 10, y: 10 },
              size: { width: 120, height: 40 },
              content: { type: "doc", content: [{ type: "text", text: "Topo" }] },
            },
          ],
        },
        footer: {
          enabled: false,
          height: 80,
          blocks: [
            {
              id: "block-footer",
              type: "text",
              position: { x: 20, y: 10 },
              size: { width: 120, height: 40 },
              content: { type: "doc", content: [{ type: "text", text: "Base" }] },
            },
          ],
        },
      },
      pages: [{ id: "page-1", blocks: [] }],
    });

    expect(html).not.toContain("block-header");
    expect(html).not.toContain("block-footer");
  });

  it("handles empty header/footer blocks", () => {
    const html = renderDocumentToHtml({
      title: "Regions",
      page: { format: "A4", orientation: "portrait" },
      regions: {
        header: { enabled: true, height: 100, blocks: [] },
        footer: { enabled: true, height: 80, blocks: null },
      },
      pages: [{ id: "page-1", blocks: [] }],
    });

    expect(html).toContain("data-page-id=\"page-1\"");
  });

  it("handles page blocks when not an array", () => {
    const html = renderDocumentToHtml({
      title: "Blocks",
      page: { format: "A4", orientation: "portrait" },
      pages: [{ id: "page-1", blocks: null }],
    });

    expect(html).toContain("data-page-id=\"page-1\"");
  });

  it("renders image block without src", () => {
    const html = renderDocumentToHtml({
      title: "Img",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-image",
              type: "image",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 80 },
            },
          ],
        },
      ],
    });

    expect(html).toContain("block-image");
  });

  it("handles landscape and unknown format", () => {
    const html = renderDocumentToHtml({
      title: "Landscape",
      page: { format: "Unknown", orientation: "landscape" },
      pages: [{ id: "page-1", blocks: [] }],
    });

    expect(html).toContain("@page { size:");
  });

  it("escapes title content", () => {
    const html = renderDocumentToHtml({
      title: "Doc \"1\"",
      page: { format: "A4", orientation: "portrait" },
      pages: [{ id: "page-1", blocks: [] }],
    });

    expect(html).toContain("Doc &quot;1&quot;");
  });

  it("falls back to default title on empty string", () => {
    const html = renderDocumentToHtml({
      title: "",
      page: { format: "A4", orientation: "portrait" },
      pages: [{ id: "page-1", blocks: [] }],
    });

    expect(html).toContain("Documento");
  });

  it("renders empty text when content missing", () => {
    const html = renderDocumentToHtml({
      title: "Empty",
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
            },
          ],
        },
      ],
    });

    expect(html).toContain("block-text");
  });

  it("renders empty text when content is invalid", () => {
    const html = renderDocumentToHtml({
      title: "Invalid",
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
              content: { type: "doc", content: null },
            },
          ],
        },
      ],
    });

    expect(html).toContain("block-text");
  });


  it("handles empty text node", () => {
    const html = renderDocumentToHtml({
      title: "EmptyText",
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
              content: { type: "doc", content: [{ type: "text" }] },
            },
          ],
        },
      ],
    });

    expect(html).toContain("block-text");
  });

  it("renders empty table when rows missing", () => {
    const html = renderDocumentToHtml({
      title: "Table",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "block-table",
              type: "table",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 40 },
              content: null,
            },
          ],
        },
      ],
    });

    expect(html).toContain("block-table");
  });
});
