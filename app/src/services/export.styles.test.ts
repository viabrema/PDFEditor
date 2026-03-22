import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export";

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

  it("renders legacy title and subtitle styles", () => {
    const html = renderDocumentToHtml({
      title: "Legacy",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "legacy-title",
              type: "title",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Titulo" }] },
                ],
              },
            },
            {
              id: "legacy-subtitle",
              type: "subtitle",
              position: { x: 0, y: 80 },
              size: { width: 120, height: 60 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Sub" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    const titleMatch = html.match(
      /class="block text-block" style="([^"]+)" data-block-id="legacy-title"/
    );
    const subtitleMatch = html.match(
      /class="block text-block" style="([^"]+)" data-block-id="legacy-subtitle"/
    );

    expect(titleMatch).not.toBeNull();
    expect(subtitleMatch).not.toBeNull();
    expect(titleMatch[1]).toContain("font-size: 26px");
    expect(subtitleMatch[1]).toContain("font-size: 22px");
  });

  it("uses heading level from metadata.level", () => {
    const html = renderDocumentToHtml({
      title: "HeadingLevel",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "heading-level",
              type: "heading",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              metadata: { level: 2 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Nivel" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    const match = html.match(
      /class="block text-block" style="([^"]+)" data-block-id="heading-level"/
    );
    expect(match).not.toBeNull();
    expect(match[1]).toContain("font-size: 22px");
  });

  it("covers heading level branches", () => {
    const titleHtml = renderDocumentToHtml({
      title: "BranchTitle",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "branch-title",
              type: "title",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "T" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    const subtitleHtml = renderDocumentToHtml({
      title: "BranchSubtitle",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "branch-subtitle",
              type: "subtitle",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "S" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    const headingHtml = renderDocumentToHtml({
      title: "BranchHeading",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "branch-heading",
              type: "heading",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              metadata: { headingLevel: 3 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "H" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(titleHtml).toContain("font-size: 26px");
    expect(subtitleHtml).toContain("font-size: 22px");
    expect(headingHtml).toContain("font-size: 18px");
  });

  it("defaults heading level when metadata is missing", () => {
    const html = renderDocumentToHtml({
      title: "HeadingDefault",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "heading-default",
              type: "heading",
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              content: {
                type: "doc",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "H" }] },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(html).toContain("font-size: 26px");
  });
});
