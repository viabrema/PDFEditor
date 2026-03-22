import { describe, expect, it } from "vitest";
import { buildDocumentAiPrompt } from "./aiPrompts";

describe("buildDocumentAiPrompt", () => {
  const layout = [
    {
      id: "b1",
      pageId: "p1",
      pageIndex: 1,
      pageName: "Pagina 1",
      region: "body",
      type: "text",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      summary: "Ola",
    },
  ];

  it("includes layout and focusOrder in edit mode", () => {
    const prompt = buildDocumentAiPrompt({
      activeLanguageLabel: "PT",
      documentLayout: layout,
      focusedBlocks: [
        {
          focusOrder: 1,
          snapshot: { id: "b1", type: "text", content: {} },
        },
      ],
      instruction: "Mude o titulo",
      mode: "edit",
      pageSize: { width: 595, height: 842 },
      gridSize: 15,
    });
    expect(prompt).toContain("Layout do documento");
    expect(prompt).toContain('"id":"b1"');
    expect(prompt).toContain("focusOrder");
    expect(prompt).toContain("Primeiro bloco selecionado");
    expect(prompt).toContain("actions");
  });

  it("analysis mode asks for plain text only", () => {
    const prompt = buildDocumentAiPrompt({
      activeLanguageLabel: "PT",
      documentLayout: layout,
      focusedBlocks: [],
      instruction: "Analise o documento",
      mode: "analysis",
      pageSize: { width: 595, height: 842 },
      gridSize: 15,
    });
    expect(prompt).toContain("analisa");
    expect(prompt).not.toContain('"actions"');
  });

  it("format mode extends update schema", () => {
    const prompt = buildDocumentAiPrompt({
      activeLanguageLabel: "PT",
      documentLayout: layout,
      focusedBlocks: [],
      instruction: "Negrito",
      mode: "format",
      pageSize: { width: 595, height: 842 },
      gridSize: 15,
    });
    expect(prompt).toContain("textStyle");
    expect(prompt).toContain("blockFormat");
  });
});
