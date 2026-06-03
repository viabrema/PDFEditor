import { describe, expect, it } from "vitest";
import { resolveHubChatId, resolveHubResponseText } from "./hubResponse";

describe("resolveHubResponseText", () => {
  it("returns empty for null and non-object values", () => {
    expect(resolveHubResponseText(null)).toBe("");
    expect(resolveHubResponseText(42)).toBe("");
  });

  it("reads answer and nested data.answer", () => {
    expect(resolveHubResponseText({ answer: "Oi" })).toBe("Oi");
    expect(resolveHubResponseText({ data: { text: "Nested" } })).toBe("Nested");
  });

  it("stringifies payload when actions are at top level", () => {
    const raw = resolveHubResponseText({
      actions: [{ type: "create", blockType: "text", contentText: "A" }],
    });
    expect(JSON.parse(raw).actions).toHaveLength(1);
  });

  it("returns trimmed string bodies", () => {
    expect(resolveHubResponseText("  hello  ")).toBe("hello");
  });
});

describe("resolveHubChatId", () => {
  it("reads chatId and chat_id", () => {
    expect(resolveHubChatId({ chatId: "c1" }, null)).toBe("c1");
    expect(resolveHubChatId({ chat_id: "c2" }, "old")).toBe("c2");
    expect(resolveHubChatId({ data: { chatId: "c3" } }, null)).toBe("c3");
  });

  it("falls back when id missing or blank", () => {
    expect(resolveHubChatId({ chatId: "   " }, "keep")).toBe("keep");
    expect(resolveHubChatId({ data: { chat_id: "" } }, "keep")).toBe("keep");
    expect(resolveHubChatId(null, undefined)).toBe(null);
  });
});

describe("resolveHubResponseText nested branches", () => {
  it("skips blank direct fields and empty nested data", () => {
    expect(resolveHubResponseText({ answer: "   ", data: {} })).toBe("");
    expect(resolveHubResponseText({ data: { text: "ok" } })).toBe("ok");
  });
});
