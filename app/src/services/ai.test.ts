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
    expect(requestBody.provider).toBe("openai");
    expect(requestBody.model).toBe("gpt-4o-mini");
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

  it("uses resolveHubAi at request time", async () => {
    let requestBody;
    const fetcher = async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ text: "Ok" }) };
    };

    const service = createAiService({
      endpoint: "/ai",
      apiKey: "key",
      fetcher,
      provider: "openai",
      model: "gpt-4o-mini",
      resolveHubAi: () => ({ provider: "GEMINI-2", model: "gemini-2.5-flash" }),
    });
    await service.sendPrompt({ prompt: "Teste" });

    expect(requestBody.provider).toBe("GEMINI-2");
    expect(requestBody.model).toBe("gemini-2.5-flash");
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

  it("returns plain string JSON bodies as text", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => "nope",
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.text).toBe("nope");
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

  it("reads actions array at top level of JSON body", async () => {
    const fetcher = async () => ({
      ok: true,
      json: async () => ({
        actions: [{ type: "create", blockType: "text", contentText: "Hi" }],
      }),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste" });

    expect(result.text).toContain('"actions"');
    expect(JSON.parse(result.text).actions[0].contentText).toBe("Hi");
  });

  it("keeps failure when retry without chatId also fails", async () => {
    const fetcher = async () => ({
      ok: false,
      status: 502,
      json: async () => ({ message: "down" }),
    });

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste", chatId: "stale" });

    expect(result.ok).toBe(false);
    expect(result.error.status).toBe(502);
  });

  it("retries without chatId when first request fails", async () => {
    let calls = 0;
    const fetcher = async (_url, options) => {
      calls += 1;
      const body = JSON.parse(options.body);
      if (body.chatId) {
        return { ok: false, status: 400, json: async () => ({ message: "bad chat" }) };
      }
      return { ok: true, json: async () => ({ answer: "Ok" }) };
    };

    const service = createAiService({ endpoint: "/ai", apiKey: "key", fetcher });
    const result = await service.sendPrompt({ prompt: "Teste", chatId: "stale" });

    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
    expect(result.text).toBe("Ok");
    expect(result.retriedWithoutChat).toBe(true);
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
