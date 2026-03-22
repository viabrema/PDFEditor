import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "../blocks/blockModel";
import {
  getLinkedTablesToRefresh,
  isBrowserOnlyExcelPath,
  loadExcelLinkTableContent,
  loadRowsForExcelLink,
  toBrowserExcelPath,
} from "./excelLink";

describe("excelLink", () => {
  it("detects browser-only path", () => {
    expect(isBrowserOnlyExcelPath(toBrowserExcelPath("book.xlsx"))).toBe(true);
    expect(isBrowserOnlyExcelPath("C:\\data\\book.xlsx")).toBe(false);
  });

  it("getLinkedTablesToRefresh: selected linked table only", () => {
    const blocks = [
      { id: "a", type: BLOCK_TYPES.LINKED_TABLE },
      { id: "b", type: BLOCK_TYPES.TABLE },
      { id: "c", type: BLOCK_TYPES.LINKED_TABLE },
    ];
    expect(getLinkedTablesToRefresh(blocks, "a")).toEqual([blocks[0]]);
  });

  it("getLinkedTablesToRefresh: all linked when selection is not linked", () => {
    const blocks = [
      { id: "a", type: BLOCK_TYPES.LINKED_TABLE },
      { id: "b", type: BLOCK_TYPES.TEXT },
      { id: "c", type: BLOCK_TYPES.LINKED_TABLE },
    ];
    expect(getLinkedTablesToRefresh(blocks, "b")).toEqual([blocks[0], blocks[2]]);
  });

  it("getLinkedTablesToRefresh: all linked when none selected", () => {
    const blocks = [{ id: "a", type: BLOCK_TYPES.LINKED_TABLE }];
    expect(getLinkedTablesToRefresh(blocks, null)).toEqual([blocks[0]]);
  });

  it("getLinkedTablesToRefresh: empty when no linked blocks", () => {
    expect(getLinkedTablesToRefresh([{ id: "x", type: BLOCK_TYPES.TEXT }], null)).toEqual([]);
  });

  it("loadExcelLinkTableContent returns merges from workbook", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("S");
    ws.getCell(1, 1).value = "a";
    ws.mergeCells(1, 1, 1, 2);
    ws.getCell(1, 3).value = "b";
    const buf = new Uint8Array(await wb.xlsx.writeBuffer());
    const readFileFn = async () => buf;
    const { rows, merges } = await loadExcelLinkTableContent(
      { filePath: "C:\\fake\\f.xlsx", sheetName: "S", range: "A1:C1" },
      readFileFn,
    );
    expect(rows[0]).toEqual(["a", "", "b"]);
    expect(merges).toEqual([{ r: 0, c: 0, rowspan: 1, colspan: 2 }]);
  });

  it("loadRowsForExcelLink uses readFileFn", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("S");
    ws.getCell(1, 1).value = "x";
    const buf = new Uint8Array(await wb.xlsx.writeBuffer());
    const readFileFn = async () => buf;
    const rows = await loadRowsForExcelLink(
      { filePath: "C:\\fake\\f.xlsx", sheetName: "S", range: "A1:A1" },
      readFileFn,
    );
    expect(rows).toEqual([["x"]]);
  });

  it("loadRowsForExcelLink rejects browser path", async () => {
    await expect(
      loadRowsForExcelLink(
        { filePath: toBrowserExcelPath("x.xlsx"), sheetName: "S", range: "A1:A1" },
        async () => new Uint8Array(),
      ),
    ).rejects.toThrow(/desktop/);
  });

  it("loadRowsForExcelLink rejects incomplete link", async () => {
    await expect(
      loadRowsForExcelLink(
        { filePath: "C:\\a.xlsx", sheetName: "", range: "A1:A1" },
        async () => new Uint8Array(),
      ),
    ).rejects.toThrow(/incompleto/);
  });
});
