import { describe, expect, it, vi, afterEach } from "vitest";
import { createTauriHubFetcher, isTauriRuntime } from "./tauriHubFetch";

describe("tauriHubFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("isTauriRuntime is false without window", () => {
    vi.stubGlobal("window", undefined);
    expect(isTauriRuntime()).toBe(false);
  });

  it("createTauriHubFetcher returns null without Tauri", () => {
    vi.stubGlobal("window", {});
    expect(createTauriHubFetcher()).toBeNull();
  });
});
