import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createHubAiRuntime, loadHubAiRuntimeConfig } from "./hubAiRuntime";

function installLocalStorageMock() {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  vi.stubGlobal("localStorage", mock);
  return mock;
}

describe("hubAiRuntime", () => {
  beforeEach(() => {
    installLocalStorageMock().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists provider and model", () => {
    const runtime = createHubAiRuntime({ provider: "GEMINI-2", model: "gemini-2.5-flash" });
    runtime.set({ provider: "openai", model: "gpt-4o" });
    expect(loadHubAiRuntimeConfig()).toEqual({ provider: "openai", model: "gpt-4o" });
  });

  it("setProvider picks valid model for new provider", () => {
    const runtime = createHubAiRuntime({ provider: "openai", model: "gpt-4o" });
    runtime.setProvider("GEMINI-2");
    expect(runtime.get().provider).toBe("GEMINI-2");
    expect(runtime.get().model).toBe("gemini-3.1-pro-preview");
  });

  it("setModel and set update stored config", () => {
    const runtime = createHubAiRuntime({ provider: "openai", model: "gpt-4o-mini" });
    runtime.setModel("gpt-4o");
    expect(runtime.get().model).toBe("gpt-4o");
    runtime.set({ provider: "gemini" });
    expect(runtime.get().provider).toBe("gemini");
    runtime.set({ provider: "GEMINI-2" });
    expect(runtime.get().provider).toBe("GEMINI-2");
  });

  it("set keeps provider when only model is passed", () => {
    const runtime = createHubAiRuntime({ provider: "openai", model: "gpt-4o-mini" });
    runtime.set({ model: "gpt-4o" });
    expect(runtime.get()).toEqual({ provider: "openai", model: "gpt-4o" });
  });

  it("ignores invalid JSON in storage", () => {
    localStorage.setItem("pdfeditor.hubAi", "{bad");
    expect(loadHubAiRuntimeConfig().provider).toBe("openai");
  });

  it("ignores empty storage string", () => {
    localStorage.setItem("pdfeditor.hubAi", "");
    expect(loadHubAiRuntimeConfig().provider).toBe("openai");
  });

  it("loadHubAiRuntimeConfig works without localStorage", () => {
    vi.stubGlobal("localStorage", undefined);
    const cfg = loadHubAiRuntimeConfig();
    expect(cfg.provider).toBe("openai");
    expect(cfg.model).toBeTruthy();
  });

  it("ignores storage without provider field", () => {
    localStorage.setItem("pdfeditor.hubAi", JSON.stringify({ model: "gpt-4o" }));
    expect(loadHubAiRuntimeConfig().provider).toBe("openai");
  });

  it("ignores non-object storage payload", () => {
    localStorage.setItem("pdfeditor.hubAi", JSON.stringify(123));
    expect(loadHubAiRuntimeConfig().provider).toBe("openai");
  });

  it("set works when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    const runtime = createHubAiRuntime({ provider: "openai", model: "gpt-4o-mini" });
    runtime.setModel("gpt-4o");
    expect(runtime.get().model).toBe("gpt-4o");
  });

  it("createHubAiRuntime without initial uses stored config", () => {
    localStorage.setItem("pdfeditor.hubAi", JSON.stringify({ provider: "gemini", model: "gemini-2.5-flash" }));
    const runtime = createHubAiRuntime();
    expect(runtime.get()).toEqual({ provider: "gemini", model: "gemini-2.5-flash" });
  });
});
