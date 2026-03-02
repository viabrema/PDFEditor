import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export.js";

describe("export service", () => {
  it("renders basic HTML", () => {
    const document = {
      title: "Demo",
      pages: [{ id: "page-1", name: "Page 1" }],
    };

    const html = renderDocumentToHtml(document);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Demo");
    expect(html).toContain("data-page-id=\"page-1\"");
  });

  it("handles empty documents", () => {
    const html = renderDocumentToHtml({ pages: [] });

    expect(html).toContain("Document");
    expect(html).toContain("<main class=\"document\">");
  });

  it("uses a default page name", () => {
    const html = renderDocumentToHtml({
      title: "No Name",
      pages: [{ id: "page-2" }],
    });

    expect(html).toContain("Page 1");
  });

  it("handles missing document", () => {
    const html = renderDocumentToHtml();

    expect(html).toContain("Document");
  });
});
