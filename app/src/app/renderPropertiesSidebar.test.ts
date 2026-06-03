import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { renderPropertiesSidebar } from "./renderPropertiesSidebar";

describe("renderPropertiesSidebar", () => {
  it("shows page panel when no block is selected", () => {
    const window = new Window();
    globalThis.document = window.document;
    document.body.innerHTML = `
      <h2 id="properties-sidebar-title"></h2>
      <p id="properties-sidebar-subtitle"></p>
      <div id="page-dimensions"></div>
      <div id="properties-sidebar-page-panel"></div>
      <div id="properties-sidebar-block-panel" class="hidden"></div>
      <div id="page-meta"></div>
    `;

    renderPropertiesSidebar({
      refs: {
        propertiesSidebarTitle: document.querySelector("#properties-sidebar-title"),
        propertiesSidebarSubtitle: document.querySelector("#properties-sidebar-subtitle"),
        pageDimensions: document.querySelector("#page-dimensions"),
        propertiesSidebarPagePanel: document.querySelector("#properties-sidebar-page-panel"),
        propertiesSidebarBlockPanel: document.querySelector("#properties-sidebar-block-panel"),
      },
      state: { selectedBlockIds: [], editingBlockId: null, views: [] },
      blocks: [],
      documentData: { page: { format: "A4", orientation: "portrait" }, grid: { size: 8, snap: true } },
      requestRender: vi.fn(),
    });

    expect(document.querySelector("#properties-sidebar-page-panel")?.classList.contains("hidden")).toBe(
      false,
    );
    expect(document.querySelector("#page-dimensions")?.textContent).toContain("794");
  });

  it("shows block panel for a selected table", () => {
    const window = new Window();
    globalThis.document = window.document;
    document.body.innerHTML = `
      <h2 id="properties-sidebar-title"></h2>
      <p id="properties-sidebar-subtitle"></p>
      <div id="page-dimensions"></div>
      <div id="properties-sidebar-page-panel" class="hidden"></div>
      <div id="properties-sidebar-block-panel"></div>
    `;

    renderPropertiesSidebar({
      refs: {
        propertiesSidebarTitle: document.querySelector("#properties-sidebar-title"),
        propertiesSidebarSubtitle: document.querySelector("#properties-sidebar-subtitle"),
        pageDimensions: document.querySelector("#page-dimensions"),
        propertiesSidebarPagePanel: document.querySelector("#properties-sidebar-page-panel"),
        propertiesSidebarBlockPanel: document.querySelector("#properties-sidebar-block-panel"),
      },
      state: { selectedBlockIds: ["t1"], editingBlockId: null, views: [], tableEdit: null },
      blocks: [{ id: "t1", type: "table", content: { rows: [["1"]] } }],
      documentData: { page: { format: "A4", orientation: "portrait" }, grid: { size: 8, snap: true } },
      requestRender: vi.fn(),
    });

    expect(document.querySelector("#properties-sidebar-title")?.textContent).toBe("Tabela");
    expect(
      document.querySelector("#properties-sidebar-block-panel")?.classList.contains("hidden"),
    ).toBe(false);
  });
});
