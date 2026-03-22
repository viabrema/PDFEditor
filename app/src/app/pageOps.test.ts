import { describe, expect, it } from "vitest";
import { createPage } from "../editor/documentModel";
import { addDocumentPage, removeDocumentPage } from "./pageOps";

describe("pageOps", () => {
  it("addDocumentPage appends and activates new page", () => {
    const documentData = { pages: [createPage({ id: "p1", name: "Pagina 1" })] };
    const state = { activePageId: "p1" };
    const page = addDocumentPage(documentData, state);
    expect(documentData.pages).toHaveLength(2);
    expect(state.activePageId).toBe(page.id);
    expect(page.name).toBe("Pagina 2");
  });

  it("removeDocumentPage refuses last page", () => {
    const documentData = { pages: [createPage({ id: "p1", name: "Pagina 1" })] };
    const state = { activePageId: "p1", selectedBlockIds: [], editingBlockId: null };
    const blocks: any[] = [];
    expect(removeDocumentPage(documentData, state, blocks, "p1")).toBe(false);
    expect(documentData.pages).toHaveLength(1);
  });

  it("removeDocumentPage drops body blocks and fixes selection", () => {
    const documentData = {
      pages: [
        createPage({ id: "p1", name: "Pagina 1" }),
        createPage({ id: "p2", name: "Pagina 2" }),
      ],
    };
    const state = {
      activePageId: "p2",
      selectedBlockIds: ["b1", "b2"],
      editingBlockId: "b2",
    };
    const blocks = [
      { id: "b1", pageId: "p1" },
      { id: "b2", pageId: "p2" },
    ];
    expect(removeDocumentPage(documentData, state, blocks, "p2")).toBe(true);
    expect(documentData.pages).toHaveLength(1);
    expect(documentData.pages[0].id).toBe("p1");
    expect(state.activePageId).toBe("p1");
    expect(blocks).toEqual([{ id: "b1", pageId: "p1" }]);
    expect(state.selectedBlockIds).toEqual(["b1"]);
    expect(state.editingBlockId).toBeNull();
  });
});
