import { describe, expect, it } from "vitest";
import { renderDocumentToHtml } from "./export.js";

describe("export service (markdown)", () => {
  it("renders markdown text blocks", () => {
    const html = renderDocumentToHtml({
      title: "Markdown",
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
              content: "# Titulo\n\nOla",
            },
          ],
        },
      ],
    });

    expect(html).toContain("<h1>Titulo</h1>");
    expect(html).toContain("<p>Ola</p>");
  });
});
