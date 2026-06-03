import { describe, expect, it } from "vitest";
import {
  getDefaultHubAiModel,
  getDefaultHubAiProvider,
  getModelsForHubAiProvider,
  isKnownHubAiProvider,
  normalizeHubAiSelection,
} from "./hubAiCatalog";

describe("hubAiCatalog", () => {
  it("returns models for openai", () => {
    const models = getModelsForHubAiProvider("openai");
    expect(models.some((m) => m.id === "gpt-4o-mini")).toBe(true);
  });

  it("gemini providers expose only the hub gemini model set", () => {
    const expected = [
      "gemini-3.1-pro-preview",
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ];
    for (const provider of ["GEMINI-2", "gemini"] as const) {
      expect(getModelsForHubAiProvider(provider).map((m) => m.id)).toEqual(expected);
    }
    expect(getDefaultHubAiModel("GEMINI-2")).toBe("gemini-3.1-pro-preview");
    expect(getDefaultHubAiModel("gemini")).toBe("gemini-3.1-pro-preview");
  });

  it("normalizes unknown provider to default", () => {
    const out = normalizeHubAiSelection("unknown", "gpt-4o-mini");
    expect(out.provider).toBe("openai");
    expect(out.model).toBe("gpt-4o-mini");
  });

  it("falls back model when invalid for provider", () => {
    const out = normalizeHubAiSelection("openai", "gemini-2.5-flash");
    expect(out.model).toBe("gpt-4o-mini");
  });

  it("returns empty models for unknown provider id", () => {
    expect(getModelsForHubAiProvider("nope")).toEqual([]);
    expect(getDefaultHubAiModel("nope")).toBe("gpt-4o-mini");
    expect(isKnownHubAiProvider("nope")).toBe(false);
  });

  it("getDefaultHubAiProvider returns first catalog entry", () => {
    expect(getDefaultHubAiProvider()).toBe("openai");
  });
});
