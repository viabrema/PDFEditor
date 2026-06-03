import { describe, expect, it } from "vitest";
import { isAnalysisInstruction, isDocumentEditInstruction } from "./aiPrompts";

describe("AI instruction modes", () => {
  it("treats create-with-summary as edit not analysis", () => {
    const instruction = "crie um box de texto resumindo a tabela selecionada";
    expect(isDocumentEditInstruction(instruction)).toBe(true);
    expect(isAnalysisInstruction(instruction)).toBe(false);
  });

  it("keeps pure analysis instructions", () => {
    expect(isAnalysisInstruction("resuma o documento")).toBe(true);
    expect(isDocumentEditInstruction("resuma o documento")).toBe(false);
  });
});

describe("isFormattingInstruction", () => {
  it("does not treat table visual edits as text format mode", async () => {
    const { isFormattingInstruction } = await import("./aiPrompts");
    expect(isFormattingInstruction("altere a primeira linha com fundo vermelho")).toBe(false);
  });
});
