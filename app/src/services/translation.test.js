import { describe, expect, it } from "vitest";
import { createTranslationService } from "./translation.js";

describe("translation service", () => {
  it("requires an endpoint", () => {
    expect(() => createTranslationService()).toThrow(/endpoint/);
  });

  it("returns ok result on success", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ text: "Ola" }),
    });

    const service = createTranslationService({ endpoint: "/translate", fetcher });
    const result = await service.translateText({
      text: "Hello",
      sourceLang: "en",
      targetLang: "pt",
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ text: "Ola" });
  });

  it("returns error result on failure", async () => {
    const fetcher = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: "fail" }),
    });

    const service = createTranslationService({ endpoint: "/translate", fetcher });
    const result = await service.translateText({
      text: "Hello",
      sourceLang: "en",
      targetLang: "pt",
    });

    expect(result.ok).toBe(false);
    expect(result.error.status).toBe(500);
  });

  it("uses global fetch when no fetcher is provided", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ text: "Oi" }),
    });

    try {
      const service = createTranslationService({ endpoint: "/translate" });
      const result = await service.translateText({
        text: "Hi",
        sourceLang: "en",
        targetLang: "pt",
      });

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ text: "Oi" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
