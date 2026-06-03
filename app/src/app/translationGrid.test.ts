import { describe, expect, it, vi } from "vitest";
import {
  resolveChartRowsForTranslation,
  translateChartContent,
  translateStringMatrix,
} from "./translationGrid";
import type { ChartBlockContent } from "../blocks/chartBlockTypes";
import { emptyChartContent } from "../blocks/chartBlockTypes";

const documentData = {
  languages: [
    { id: "lang-pt", label: "PT", isDefault: true },
    { id: "lang-en", label: "EN" },
  ],
};

const opts = {
  translationService: {
    translatePrompt: async ({ prompt }: { prompt: string }) => {
      const m = prompt.match(/Texto \(JSON array\):\n(.*)$/s);
      const arr = m ? (JSON.parse(m[1]) as string[]) : [];
      return { ok: true, text: JSON.stringify(arr.map((s) => `EN:${s}`)) };
    },
    translateText: async ({ text }: { text: string }) => ({ ok: true, text: `EN:${text}` }),
  },
  documentData,
  sourceLanguageId: "lang-pt",
  targetLanguageId: "lang-en",
};

describe("translationGrid", () => {
  it("translateStringMatrix skips empty cells and preserves layout", async () => {
    const out = await translateStringMatrix(
      [
        ["Oi", ""],
        ["", "Tchau"],
      ],
      opts,
    );
    expect(out).toEqual([
      ["EN:Oi", ""],
      ["", "EN:Tchau"],
    ]);
  });

  it("translateStringMatrix returns empty matrix unchanged", async () => {
    const translatePrompt = vi.fn();
    const out = await translateStringMatrix([], {
      ...opts,
      translationService: { ...opts.translationService, translatePrompt },
    });
    expect(out).toEqual([]);
    expect(translatePrompt).not.toHaveBeenCalled();
  });

  it("resolveChartRowsForTranslation uses linked table block", () => {
    const content: ChartBlockContent = {
      ...emptyChartContent(),
      dataSourceRows: [],
      dataSourceBlockId: "tbl-1",
    };
    const rows = resolveChartRowsForTranslation(content, [
      {
        id: "tbl-1",
        type: "linkedTable",
        content: { dataSourceRows: [["Mes"], ["Jan"]] },
      },
    ]);
    expect(rows).toEqual([["Mes"], ["Jan"]]);
  });

  it("translateChartContent translates grid, title and series labels", async () => {
    const raw = {
      configured: true,
      firstRowIsHeader: true,
      dataSourceRows: [
        ["Mes", "Vendas"],
        ["Jan", "10"],
      ],
      chart: {
        version: 1,
        baseType: "line",
        title: { text: "Resumo" },
        datasets: [{ id: "ds-1", label: "Receita", mapping: { xColumnIndex: 0, yColumnIndex: 1 } }],
      },
    };
    const out = await translateChartContent(raw, opts);
    expect(out.dataSourceRows[0][0]).toBe("EN:Mes");
    expect(out.chart.title?.text).toBe("EN:Resumo");
    expect(out.chart.datasets[0].label).toBe("EN:Receita");
    expect(out.configured).toBe(true);
  });

  it("translateChartContent skips empty title and dataset label", async () => {
    const raw = {
      configured: true,
      dataSourceRows: [["A"]],
      firstRowIsHeader: false,
      chart: {
        version: 1,
        baseType: "bar",
        title: { text: "   " },
        datasets: [{ id: "ds-1", label: "", mapping: { xColumnIndex: 0, yColumnIndex: 0 } }],
      },
    };
    const translateText = vi.fn();
    await translateChartContent(raw, {
      ...opts,
      translationService: { ...opts.translationService, translateText },
    });
    expect(translateText).not.toHaveBeenCalled();
  });
});
