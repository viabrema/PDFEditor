import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "../blocks/blockModel";
import {
  blockHasExcelLink,
  getLinkedExcelBlocksToRefresh,
  getLinkedTablesToRefresh,
  isBrowserOnlyExcelPath,
  loadExcelLinkTableContent,
  loadRowsForExcelLink,
  toBrowserExcelPath,
} from "./excelLink";

describe("excelLink", () => {
  it("blockHasExcelLink is false for undefined block", () => {
    expect(blockHasExcelLink(undefined)).toBe(false);
  });

  it("blockHasExcelLink is false when link fields are incomplete", () => {
    expect(
      blockHasExcelLink({
        metadata: { excelLink: { filePath: null, sheetName: "S", range: "A1" } as any },
      }),
    ).toBe(false);
    expect(
      blockHasExcelLink({
        metadata: { excelLink: { sheetName: "S", range: "A1" } as any },
      }),
    ).toBe(false);
    expect(blockHasExcelLink({ metadata: { excelLink: {} as any } })).toBe(false);
    expect(
      blockHasExcelLink({
        metadata: { excelLink: { filePath: "C:\\a.xlsx", sheetName: "", range: "A1" } },
      }),
    ).toBe(false);
    expect(
      blockHasExcelLink({
        metadata: { excelLink: { filePath: "C:\\a.xlsx", sheetName: "S", range: null as any } },
      }),
    ).toBe(false);
  });

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
    expect(getLinkedTablesToRefresh(blocks, ["a"])).toEqual([blocks[0]]);
  });

  it("getLinkedTablesToRefresh: all linked when selection is not linked", () => {
    const blocks = [
      { id: "a", type: BLOCK_TYPES.LINKED_TABLE },
      { id: "b", type: BLOCK_TYPES.TEXT },
      { id: "c", type: BLOCK_TYPES.LINKED_TABLE },
    ];
    expect(getLinkedTablesToRefresh(blocks, ["b"])).toEqual([blocks[0], blocks[2]]);
  });

  it("getLinkedTablesToRefresh: all linked when none selected", () => {
    const blocks = [{ id: "a", type: BLOCK_TYPES.LINKED_TABLE }];
    expect(getLinkedTablesToRefresh(blocks, [])).toEqual([blocks[0]]);
  });

  it("getLinkedTablesToRefresh: multiple linked selection returns those", () => {
    const blocks = [
      { id: "a", type: BLOCK_TYPES.LINKED_TABLE },
      { id: "c", type: BLOCK_TYPES.LINKED_TABLE },
    ];
    expect(getLinkedTablesToRefresh(blocks, ["a", "c"])).toEqual([blocks[0], blocks[1]]);
  });

  it("getLinkedTablesToRefresh: empty when no linked blocks", () => {
    expect(getLinkedTablesToRefresh([{ id: "x", type: BLOCK_TYPES.TEXT }], [])).toEqual([]);
  });

  const excelLink = { filePath: "C:\\a.xlsx", sheetName: "S1", range: "A1:B2" };

  it("getLinkedExcelBlocksToRefresh: selected linked chart", () => {
    const blocks = [
      { id: "a", type: BLOCK_TYPES.CHART, metadata: { excelLink } },
      { id: "b", type: BLOCK_TYPES.TEXT },
    ];
    expect(getLinkedExcelBlocksToRefresh(blocks, ["a"])).toEqual([blocks[0]]);
  });

  it("getLinkedExcelBlocksToRefresh: selection without excel link falls back to all linked", () => {
    const blocks = [
      { id: "a", type: BLOCK_TYPES.CHART, metadata: {} },
      { id: "b", type: BLOCK_TYPES.LINKED_TABLE, metadata: { excelLink } },
    ];
    expect(getLinkedExcelBlocksToRefresh(blocks, ["a"])).toEqual([blocks[1]]);
    expect(getLinkedExcelBlocksToRefresh(blocks, [])).toEqual([blocks[1]]);
  });

  it("getLinkedExcelBlocksToRefresh: merges linked table and linked chart when none selected", () => {
    const blocks = [
      { id: "t", type: BLOCK_TYPES.LINKED_TABLE, metadata: { excelLink } },
      { id: "c", type: BLOCK_TYPES.CHART, metadata: { excelLink } },
    ];
    expect(getLinkedExcelBlocksToRefresh(blocks, [])).toEqual(blocks);
  });

  it("getLinkedTablesToRefresh treats null selectedBlockIds as empty", () => {
    const blocks = [{ id: "a", type: BLOCK_TYPES.LINKED_TABLE }];
    expect(getLinkedTablesToRefresh(blocks, null as any)).toEqual([blocks[0]]);
  });

  it("getLinkedExcelBlocksToRefresh treats undefined selectedBlockIds as empty", () => {
    const blocks = [{ id: "t", type: BLOCK_TYPES.LINKED_TABLE, metadata: { excelLink } }];
    expect(getLinkedExcelBlocksToRefresh(blocks, undefined as any)).toEqual([blocks[0]]);
  });

  it("getLinkedExcelBlocksToRefresh ignores unknown selected ids", () => {
    const blocks = [{ id: "t", type: BLOCK_TYPES.LINKED_TABLE, metadata: { excelLink } }];
    expect(getLinkedExcelBlocksToRefresh(blocks, ["missing"])).toEqual([blocks[0]]);
  });

  it("getLinkedExcelBlocksToRefresh ignores chart with incomplete excel link in selection", () => {
    const blocks = [
      {
        id: "c",
        type: BLOCK_TYPES.CHART,
        metadata: { excelLink: { filePath: "", sheetName: "S", range: "A1" } },
      },
      { id: "t", type: BLOCK_TYPES.LINKED_TABLE, metadata: { excelLink } },
    ];
    expect(getLinkedExcelBlocksToRefresh(blocks, ["c"])).toEqual([blocks[1]]);
  });

  it("loadExcelLinkTableContent returns cellStyles when workbook has styled cell", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("S");
    const c = ws.getCell(1, 1);
    c.value = "x";
    c.font = { bold: true, color: { argb: "FF00FF00" } };
    const buf = new Uint8Array(await wb.xlsx.writeBuffer());
    const data = await loadExcelLinkTableContent(
      { filePath: "C:\\fake\\f.xlsx", sheetName: "S", range: "A1:A1" },
      async () => buf,
    );
    expect(data.cellStyles?.["0,0"]?.fontWeight).toBe("bold");
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
