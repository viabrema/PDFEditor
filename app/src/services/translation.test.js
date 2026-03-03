import { describe, expect, it } from "vitest";
import { createTranslationService } from "./translation.js";

describe("translation service", () => {
  it("requires an endpoint", () => {
    expect(() => createTranslationService()).toThrow(/endpoint/);
  });

  it("requires an api key", () => {
    expect(() => createTranslationService({ endpoint: "/translate" })).toThrow(/api key/);
  });

  it("returns ok result on success", async () => {
    let requestBody;
    const fetcher = async (url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ text: "Ola" }),
      };
    };

    const service = createTranslationService({
      endpoint: "/translate",
      apiKey: "key",
      fetcher,
    });
    const result = await service.translateText({
      text: "Hello",
      sourceLang: "ingles",
      targetLang: "portugues",
    });

    expect(result.ok).toBe(true);
    expect(result.text).toBe("Ola");
    expect(requestBody.provider).toBe("gemini");
    expect(requestBody.model).toBe("gemini-2.5-flash-lite");
  });

  it("sends custom prompt", async () => {
    let requestBody;
    const fetcher = async (url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ text: "Oi" }),
      };
    };

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
    const result = await service.translatePrompt({ prompt: "Teste" });

    expect(result.ok).toBe(true);
    expect(requestBody.prompt).toBe("Teste");
  });

  it("returns error result on failure", async () => {
    const fetcher = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: "fail" }),
    });

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
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
      const service = createTranslationService({ endpoint: "/translate", apiKey: "key" });
      const result = await service.translateText({
        text: "Hi",
        sourceLang: "ingles",
        targetLang: "portugues",
      });

      expect(result.ok).toBe(true);
      expect(result.text).toBe("Oi");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses alternate text fields", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ response: "Hola" }),
    });

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
    const result = await service.translateText({
      text: "Hi",
      sourceLang: "ingles",
      targetLang: "espanhol",
    });

    expect(result.text).toBe("Hola");
  });

  it("supports custom provider and model", async () => {
    let requestBody;
    const fetcher = async (url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ output: "Salut" }),
      };
    };

    const service = createTranslationService({
      endpoint: "/translate",
      apiKey: "key",
      fetcher,
      provider: "custom",
      model: "custom-model",
    });
    const result = await service.translateText({
      text: "Oi",
      sourceLang: "portugues",
      targetLang: "frances",
    });

    expect(result.text).toBe("Salut");
    expect(requestBody.provider).toBe("custom");
    expect(requestBody.model).toBe("custom-model");
  });

  it("returns empty text when payload is not object", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => "nope",
    });

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
    const result = await service.translateText({
      text: "Oi",
      sourceLang: "portugues",
      targetLang: "ingles",
    });

    expect(result.text).toBe("");
  });

  it("reads message field when present", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ message: "Ok" }),
    });

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
    const result = await service.translateText({
      text: "Oi",
      sourceLang: "portugues",
      targetLang: "ingles",
    });

    expect(result.text).toBe("Ok");
  });

  it("reads answer field when present", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ answer: "Oi" }),
    });

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
    const result = await service.translateText({
      text: "Hi",
      sourceLang: "ingles",
      targetLang: "portugues",
    });

    expect(result.text).toBe("Oi");
  });

  it("reads result field when present", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ result: "Oi" }),
    });

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
    const result = await service.translateText({
      text: "Hi",
      sourceLang: "ingles",
      targetLang: "portugues",
    });

    expect(result.text).toBe("Oi");
  });

  it("returns empty text for empty object", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({}),
    });

    const service = createTranslationService({ endpoint: "/translate", apiKey: "key", fetcher });
    const result = await service.translateText({
      text: "Oi",
      sourceLang: "portugues",
      targetLang: "ingles",
    });

    expect(result.text).toBe("");
  });
});
