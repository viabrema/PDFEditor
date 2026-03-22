import { describe, expect, it } from "vitest";
import {
  translateBlockFromSource,
  translateFromDefaultLanguage,
  translateTextBatch,
} from "./translationFlow";
import { extractTextFromNode } from "./textUtils";

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

  it("translates blocks without languageId", async () => {
    const translationService = {
      translatePrompt: async () => ({ ok: true, text: "[\"Hello\"]" }),
      translateText: async () => ({ ok: true, text: "Hello" }),
    };

    const blocks = [
      {
        id: "block-3",
        type: "text",
        position: { x: 0, y: 0 },
        size: { width: 120, height: 60 },
        pageId: "page-1",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Oi" }],
            },
          ],
        },
      },
    ];
    const state = { translation: { loading: false, error: null } };
    const render = () => {};

    await translateFromDefaultLanguage({
      translationService,
      documentData,
      state,
      blocks,
      render,
      targetLanguageId: "lang-en",
    });

    expect(blocks[0].languageId).toBe("lang-pt");
    const translated = blocks.find((block) => block.languageId === "lang-en");
    expect(translated).toBeTruthy();
    expect(extractTextFromNode(translated.content).trim()).toBe("Hello");
  });

  it("translateTextBatch splits large lists into chunks", async () => {
    const calls: number[] = [];
    const translationService = {
      translatePrompt: async ({ prompt }: { prompt: string }) => {
        const m = prompt.match(/Texto \(JSON array\):\n(.*)$/s);
        const arr = m ? (JSON.parse(m[1]) as string[]) : [];
        calls.push(arr.length);
        const json = JSON.stringify(arr.map((s) => `_${s}`));
        return { ok: true, text: json };
      },
    };
    const texts = Array.from({ length: 45 }, (_, i) => `c${i}`);
    const out = await translateTextBatch({
      translationService,
      documentData,
      texts,
      sourceLanguageId: "lang-pt",
      targetLanguageId: "lang-en",
    });
    expect(calls).toEqual([40, 5]);
    expect(out).toHaveLength(45);
    expect(out[0]).toBe("_c0");
    expect(out[44]).toBe("_c44");
  });

  it("translateTextBatch keeps originals when API returns fewer array entries", async () => {
    const translationService = {
      translatePrompt: async () => ({
        ok: true,
        text: JSON.stringify(["A", "B"]),
      }),
    };
    const out = await translateTextBatch({
      translationService,
      documentData,
      texts: ["x", "y", "z"],
      sourceLanguageId: "lang-pt",
      targetLanguageId: "lang-en",
    });
    expect(out).toEqual(["A", "B", "z"]);
  });
});
