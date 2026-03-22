import { describe, expect, it } from "vitest";
import { parseCssPx, renderDocumentToHtml } from "./export";

describe("export service (PDF text clamp)", () => {
  it("parseCssPx uses fallback when value is missing or not px", () => {
    expect(parseCssPx(undefined, 16)).toBe(16);
    expect(parseCssPx(null, 16)).toBe(16);
    expect(parseCssPx("", 16)).toBe(16);
    expect(parseCssPx("18px", 16)).toBe(18);
  });

  it("line-clamp falls back to 1 when height is not finite", () => {
    const html = renderDocumentToHtml({
      title: "ClampH",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "b-zero",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 0 },
              content: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
              },
            },
            {
              id: "b-nan",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 100, height: Number.NaN },
              content: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
              },
            },
          ],
        },
      ],
    });
    expect(html.match(/-webkit-line-clamp: 1/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("line-clamp falls back to 1 when line height computes to zero", () => {
    const html = renderDocumentToHtml({
      title: "ClampFont",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "b-0font",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 200 },
              metadata: { fontSize: "0px" },
              content: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
              },
            },
          ],
        },
      ],
    });
    expect(html).toContain("-webkit-line-clamp: 1");
  });

  it("line-clamp uses fallback font px when size is not in px units", () => {
    const html = renderDocumentToHtml({
      title: "ClampRem",
      page: { format: "A4", orientation: "portrait" },
      pages: [
        {
          id: "page-1",
          blocks: [
            {
              id: "b-rem",
              type: "text",
              position: { x: 0, y: 0 },
              size: { width: 100, height: 80 },
              metadata: { fontSize: "1.25rem" },
              content: {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
              },
            },
          ],
        },
      ],
    });
    expect(html).toMatch(/-webkit-line-clamp: \d+/);
    expect(html).toContain("font-size: 1.25rem");
  });
});
