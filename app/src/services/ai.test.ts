import { describe, expect, it } from "vitest";
import { createAiService } from "./ai";

describe("ai service", () => {
  it("requires an endpoint", () => {
    expect(() => createAiService()).toThrow(/endpoint/i);
  });

  it("requires an api key", () => {
    expect(() => createAiService({ endpoint: "/ai" })).toThrow(/api key/i);
  });

  it("returns ok result on success", async () => {
    let requestBody;
    const fetcher = async (url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ answer: "Oi", chatId: "chat-1" }),
      };
    };

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.ok).toBe(true);
    expect(result.text).toBe("Oi");
    expect(result.chatId).toBe("chat-1");
    expect(requestBody.provider).toBe("gemini");
    expect(requestBody.model).toBe("gemini-2.5-flash-lite");
  });

  it("sends chatId when provided", async () => {
    let requestBody;
    const fetcher = async (url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ text: "Ok" }),
      };
    };

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste", chatId: "chat-2" });

    expect(result.ok).toBe(true);
    expect(requestBody.chatId).toBe("chat-2");
  });

  it("supports custom provider and model", async () => {
    let requestBody;
    const fetcher = async (url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ output: "Ok" }),
      };
    };

    const service = createAiService({
      endpoint: "/ai",
      apiKey: "key",
      fetcher,
      provider: "custom",
      model: "custom-model",
    });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.ok).toBe(true);
    expect(requestBody.provider).toBe("custom");
    expect(requestBody.model).toBe("custom-model");
  });

  it("returns error on failure", async () => {
    const fetcher = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: "fail" }),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.ok).toBe(false);
    expect(result.error.status).toBe(500);
  });

  it("returns empty text for non object payload", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => "nope",
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.text).toBe("");
  });

  it("returns empty text for empty object", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({}),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.text).toBe("");
  });

  it("uses global fetch when no fetcher is provided", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ text: "Oi" }),
    });

    try {
      const service = createAiService({ endpoint: "/ai", apiKey: "key" });
      const result = await service.sendPrompt({ prompt: "Teste", chatId: "chat-3" });

      expect(result.text).toBe("Oi");
      expect(result.chatId).toBe("chat-3");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("falls back to response field", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ response: "Ok" }),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.text).toBe("Ok");
  });

  it("returns null chatId when missing", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ output: "Ok" }),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.chatId).toBe(null);
  });

  it("falls back to message field", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ message: "Tudo bem" }),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.text).toBe("Tudo bem");
  });

  it("falls back to result field", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({ result: "Ok" }),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.text).toBe("Ok");
  });
});
