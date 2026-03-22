import { BLOCK_TYPES } from "../blocks/blockModel";
import { extractRangeToRows } from "./excelRange";
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

export function getLinkedTablesToRefresh(blocks: any[], selectedBlockId: string | null) {
  const selected = selectedBlockId ? blocks.find((b) => b.id === selectedBlockId) : null;
  if (selected?.type === BLOCK_TYPES.LINKED_TABLE) {
    return [selected];
  }
  return blocks.filter((b) => b.type === BLOCK_TYPES.LINKED_TABLE);
}

export async function loadRowsForExcelLink(
  link: ExcelLinkMeta,
  readFileFn: (path: string) => Promise<Uint8Array> = readBinaryFileFromPath,
): Promise<string[][]> {
  if (!link?.filePath || !link?.sheetName || !link?.range) {
    throw new Error("Link Excel incompleto (ficheiro, folha ou intervalo em falta).");
  }
  if (isBrowserOnlyExcelPath(link.filePath)) {
    throw new Error(
      "Atualizar link nao disponivel no browser: abra o documento na app desktop com Tauri.",
    );
  }
  const bytes = await readFileFn(link.filePath);
  return extractRangeToRows(bytes, link.sheetName, link.range);
}
