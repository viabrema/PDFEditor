import { describe, expect, it } from "vitest";
import {
  createDocument,
  createLanguage,
  createPage,
  deserializeDocument,
  DOCUMENT_SCHEMA_VERSION,
  serializeDocument,
} from "./documentModel";

describe("documentModel", () => {
  it("creates a default document", () => {
    const document = createDocument({
      id: "doc-1",
      languages: [createLanguage({ id: "lang-1", isDefault: true })],
      pages: [createPage({ id: "page-1" })],
      metadata: {
        createdAt: "2026-03-02T00:00:00.000Z",
        updatedAt: "2026-03-02T00:00:00.000Z",
      },
    });

    expect(document.version).toBe(DOCUMENT_SCHEMA_VERSION);
    expect(document.page.format).toBe("A4");
    expect(document.page.orientation).toBe("portrait");
    expect(document.grid.size).toBe(8);
    expect(document.grid.snap).toBe(true);
    expect(document.languages).toHaveLength(1);
    expect(document.pages).toHaveLength(1);
    expect(document.regions.header.enabled).toBe(true);
    expect(document.regions.header.height).toBe(96);
    expect(document.regions.footer.enabled).toBe(true);
    expect(document.regions.footer.height).toBe(96);
  });

  it("serializes and deserializes", () => {
    const document = createDocument({ id: "doc-2" });
    const payload = serializeDocument(document);
    const restored = deserializeDocument(payload);

    expect(restored).toEqual(document);
  });

  it("uses provided languages and active language", () => {
    const document = createDocument({
      id: "doc-3",
      languages: [
        createLanguage({ id: "lang-1" }),
        createLanguage({ id: "lang-2" }),
      ],
      activeLanguageId: "lang-2",
      regions: {
        header: { enabled: false, height: 120 },
      },
      pages: [createPage({ id: "page-2", name: "Page 2" })],
    });

    expect(document.activeLanguageId).toBe("lang-2");
    expect(document.pages[0].name).toBe("Page 2");
    expect(document.regions.header.enabled).toBe(false);
    expect(document.regions.header.height).toBe(120);
    expect(document.regions.footer.enabled).toBe(true);
    expect(document.metadata.createdAt).toContain("T");
  });
});
