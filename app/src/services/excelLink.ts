import { BLOCK_TYPES } from "../blocks/blockModel";
import { extractRangeToTableContent, type ExcelTableContent } from "./excelRange";
import { readBinaryFileFromPath } from "./tauriStorage";

export const BROWSER_EXCEL_PATH_PREFIX = "__browser__:";

export function isBrowserOnlyExcelPath(filePath: string): boolean {
  return filePath.startsWith(BROWSER_EXCEL_PATH_PREFIX);
}

export function toBrowserExcelPath(displayName: string): string {
  return `${BROWSER_EXCEL_PATH_PREFIX}${displayName}`;
}

export type ExcelLinkMeta = {
  filePath: string;
  sheetName: string;
  range: string;
};

export function getLinkedTablesToRefresh(blocks: any[], selectedBlockIds: string[]) {
  const selectedLinked = (selectedBlockIds || [])
    .map((id) => blocks.find((b) => b.id === id))
    .filter((b) => b?.type === BLOCK_TYPES.LINKED_TABLE);
  if (selectedLinked.length > 0) {
    return selectedLinked;
  }
  return blocks.filter((b) => b.type === BLOCK_TYPES.LINKED_TABLE);
}

export async function loadExcelLinkTableContent(
  link: ExcelLinkMeta,
  readFileFn: (path: string) => Promise<Uint8Array> = readBinaryFileFromPath,
): Promise<ExcelTableContent> {
  if (!link?.filePath || !link?.sheetName || !link?.range) {
    throw new Error("Link Excel incompleto (ficheiro, folha ou intervalo em falta).");
  }
  if (isBrowserOnlyExcelPath(link.filePath)) {
    throw new Error(
      "Atualizar link nao disponivel no browser: abra o documento na app desktop com Tauri.",
    );
  }
  const bytes = await readFileFn(link.filePath);
  return extractRangeToTableContent(bytes, link.sheetName, link.range);
}

/** Retorna apenas linhas; para mesclagens use `loadExcelLinkTableContent`. */
export async function loadRowsForExcelLink(
  link: ExcelLinkMeta,
  readFileFn?: (path: string) => Promise<Uint8Array>,
): Promise<string[][]> {
  const { rows } = await loadExcelLinkTableContent(link, readFileFn);
  return rows;
}
