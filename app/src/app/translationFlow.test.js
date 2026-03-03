import { describe, expect, it } from "vitest";
import { translateBlockFromSource } from "./translationFlow.js";
import { extractTextFromNode } from "./textUtils.js";

const documentData = {
  languages: [
    { id: "lang-pt", label: "PT", isDefault: true },
    { id: "lang-en", label: "EN" },
  ],
};

describe("translationFlow", () => {
  it("translates heading blocks using batch", async () => {
    const translationService = {
      translatePrompt: async () => ({ ok: true, text: "[\"Ola\"]" }),
      translateText: async () => ({ ok: true, text: "Ola" }),
    };

    const block = {
      id: "block-1",
      type: "heading",
      position: { x: 0, y: 0 },
      size: { width: 120, height: 60 },
      pageId: "page-1",
      languageId: "lang-pt",
      metadata: { headingLevel: 2 },
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Oi" }],
          },
        ],
      },
    };

    const translated = await translateBlockFromSource({
      translationService,
      documentData,
      block,
      sourceLanguageId: "lang-pt",
      targetLanguageId: "lang-en",
    });

    expect(translated.type).toBe("heading");
    expect(translated.languageId).toBe("lang-en");
    expect(translated.metadata.headingLevel).toBe(2);
    expect(extractTextFromNode(translated.content).trim()).toBe("Ola");
  });

  it("translates legacy title blocks using single text", async () => {
    const translationService = {
      translatePrompt: async () => ({ ok: true, text: "[\"Hello\"]" }),
      translateText: async () => ({ ok: true, text: "Hello" }),
    };

    const block = {
      id: "block-2",
      type: "title",
      position: { x: 0, y: 0 },
      size: { width: 120, height: 60 },
      pageId: "page-1",
      languageId: "lang-pt",
      metadata: {},
      content: "Oi",
    };

    const translated = await translateBlockFromSource({
      translationService,
      documentData,
      block,
      sourceLanguageId: "lang-pt",
      targetLanguageId: "lang-en",
    });

    expect(translated.type).toBe("title");
    expect(translated.languageId).toBe("lang-en");
    expect(extractTextFromNode(translated.content).trim()).toBe("Hello");
  });
});
