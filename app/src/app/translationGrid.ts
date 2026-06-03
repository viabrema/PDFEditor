import type { ChartBlockContent } from "../blocks/chartBlockTypes";
import { chartGridHasAnyValue, getChartContent } from "../blocks/chartBlock";
import { getTableDataRows } from "../blocks/linkedTableModel";
import { translateTextBatch, translateTextValue } from "./translationBatch";

type TranslateOpts = {
  translationService: any;
  documentData: any;
  sourceLanguageId: string;
  targetLanguageId: string;
};

/** Traduz matriz de strings preservando vazios e ordem (so envia celulas com texto). */
export async function translateStringMatrix(
  rows: string[][],
  opts: TranslateOpts,
): Promise<string[][]> {
  if (!rows.length) {
    return [];
  }

  const out = rows.map((row) => row.map((cell) => String(cell ?? "")));
  const texts: string[] = [];
  const slots: Array<{ row: number; col: number }> = [];

  out.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell.trim()) {
        return;
      }
      slots.push({ row: rowIndex, col: colIndex });
      texts.push(cell);
    });
  });

  if (texts.length === 0) {
    return out;
  }

  const translated = await translateTextBatch({
    translationService: opts.translationService,
    documentData: opts.documentData,
    texts,
    sourceLanguageId: opts.sourceLanguageId,
    targetLanguageId: opts.targetLanguageId,
  });

  slots.forEach(({ row, col }, index) => {
    out[row][col] = translated[index] ?? texts[index];
  });

  return out;
}

function cloneChartContent(content: ChartBlockContent): ChartBlockContent {
  return JSON.parse(JSON.stringify(content)) as ChartBlockContent;
}

/** Grelha de dados do grafico (embutida ou bloco tabela legado). */
export function resolveChartRowsForTranslation(
  content: ChartBlockContent,
  allBlocks?: { id: string; type?: string; content?: unknown }[],
): string[][] {
  if (chartGridHasAnyValue(content.dataSourceRows)) {
    return content.dataSourceRows.map((row) => row.map((c) => String(c ?? "")));
  }
  const refId = content.dataSourceBlockId;
  if (refId && allBlocks?.length) {
    const ref = allBlocks.find((b) => b.id === refId);
    if (ref && (ref.type === "table" || ref.type === "linkedTable")) {
      return getTableDataRows(ref as { type?: string; content?: unknown });
    }
  }
  return content.dataSourceRows.map((row) => row.map((c) => String(c ?? "")));
}

export async function translateChartContent(
  rawContent: unknown,
  opts: TranslateOpts & { allBlocks?: { id: string; type?: string; content?: unknown }[] },
): Promise<ChartBlockContent> {
  const content = cloneChartContent(getChartContent({ content: rawContent }));
  const rows = resolveChartRowsForTranslation(content, opts.allBlocks);
  if (rows.length > 0) {
    content.dataSourceRows = await translateStringMatrix(rows, opts);
    content.configured = true;
  }

  const titleText = content.chart?.title?.text?.trim();
  if (titleText && content.chart?.title) {
    content.chart.title.text = await translateTextValue({
      ...opts,
      text: titleText,
    });
  }

  if (Array.isArray(content.chart?.datasets)) {
    for (const ds of content.chart.datasets) {
      const label = String(ds.label ?? "").trim();
      if (!label) {
        continue;
      }
      ds.label = await translateTextValue({
        ...opts,
        text: label,
      });
    }
  }

  return content;
}
