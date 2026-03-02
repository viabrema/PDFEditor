import "./style.css";
import { createBlock } from "./blocks/blockModel.js";
import { createBlockElement } from "./blocks/blockRenderer.js";
import { setupDragResize } from "./blocks/dragResize.js";
import { createImageBlockFromFile } from "./blocks/imageBlock.js";
import {
  createDocument,
  createLanguage,
  createPage,
} from "./editor/documentModel.js";
import { createEditor, createEditorCommands } from "./editor/editor.js";
import { createToolbar } from "./ui/toolbar.js";
import { normalizeGridSize } from "./utils/grid.js";

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div>
          <h1 class="text-2xl font-semibold">PDF Editor</h1>
          <p class="text-sm text-slate-600">Editor em modo rascunho</p>
        </div>
        <div class="text-xs text-slate-500">Documento local</div>
      </div>
      <div class="mx-auto max-w-5xl px-6 pb-4" id="toolbar"></div>
    </header>
    <section class="mx-auto max-w-5xl px-6 py-6">
      <div class="mb-4 flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="page-format">
            Formato
          </label>
          <select
            id="page-format"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="page-orientation">
            Orientacao
          </label>
          <select
            id="page-orientation"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="portrait">Retrato</option>
            <option value="landscape">Paisagem</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="grid-size">
            Grid
          </label>
          <input
            id="grid-size"
            type="number"
            min="4"
            max="40"
            step="1"
            class="w-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <input id="grid-snap" type="checkbox" class="h-4 w-4" />
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="grid-snap">
            Snap
          </label>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Pagina ativa</span>
          <span class="text-sm text-slate-700" id="page-meta"></span>
        </div>
      </div>
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Idiomas</div>
        <div class="flex flex-wrap gap-2" id="language-tabs"></div>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Paginas</div>
        <div class="flex flex-wrap gap-2" id="page-tabs"></div>
      </div>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-slate-500">Canvas</div>
        <div class="flex items-center gap-2">
          <button
            id="add-image-block"
            type="button"
            class="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          >
            Novo bloco de imagem
          </button>
          <input id="image-input" type="file" accept="image/*" class="hidden" />
        </div>
      </div>
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
        <div
          id="canvas"
          class="flex max-h-[720px] flex-col gap-6 overflow-y-auto rounded-xl bg-slate-50 p-6"
        ></div>
      </div>
    </section>
  </main>
`;

const documentData = createDocument({
  title: "Documento local",
  languages: [
    createLanguage({ id: "lang-pt", label: "PT", isDefault: true }),
    createLanguage({ id: "lang-en", label: "EN" }),
  ],
  pages: [
    createPage({ id: "page-1", name: "Pagina 1" }),
    createPage({ id: "page-2", name: "Pagina 2" }),
  ],
});

const state = {
  activePageId: documentData.pages[0].id,
  activeLanguageId: documentData.activeLanguageId,
  views: [],
  interactions: [],
};

const blocks = [
  createBlock({
    position: { x: 32, y: 32 },
    size: { width: 520, height: 220 },
    pageId: "page-1",
    languageId: "lang-pt",
  }),
  createBlock({
    position: { x: 32, y: 32 },
    size: { width: 520, height: 220 },
    pageId: "page-2",
    languageId: "lang-pt",
  }),
  createBlock({
    position: { x: 32, y: 32 },
    size: { width: 520, height: 220 },
    pageId: "page-1",
    languageId: "lang-en",
  }),
];

const canvas = document.querySelector("#canvas");
const toolbarHost = document.querySelector("#toolbar");
const pageTabsHost = document.querySelector("#page-tabs");
const languageTabsHost = document.querySelector("#language-tabs");
const pageMeta = document.querySelector("#page-meta");
const addImageButton = document.querySelector("#add-image-block");
const imageInput = document.querySelector("#image-input");
const formatSelect = document.querySelector("#page-format");
const orientationSelect = document.querySelector("#page-orientation");
const gridSizeInput = document.querySelector("#grid-size");
const snapToggle = document.querySelector("#grid-snap");

const PAGE_SIZES = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
};

function getPageSize(format, orientation) {
  const base = PAGE_SIZES[format] || PAGE_SIZES.A4;
  if (orientation === "landscape") {
    return { width: base.height, height: base.width };
  }
  return base;
}

function getNextBlockPosition({ blocksForPage, blockSize, pageSize }) {
  const padding = 32;
  const offset = 24;

  if (blocksForPage.length === 0) {
    return { x: padding, y: padding };
  }

  const maxBottom = Math.max(
    ...blocksForPage.map((block) => block.position.y + block.size.height)
  );
  let nextX = padding;
  let nextY = maxBottom + offset;

  if (nextY + blockSize.height > pageSize.height - padding) {
    nextY = padding;
    nextX = padding + offset;
  }

  return { x: nextX, y: nextY };
}

function clearViews() {
  state.views.forEach((view) => view.destroy());
  state.views = [];
}

function clearInteractions() {
  state.interactions.forEach((cleanup) => cleanup());
  state.interactions = [];
}

function createTabButton({ label, isActive, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isActive
    ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
    : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderTabs(container, items, activeId, onSelect) {
  container.innerHTML = "";
  items.forEach((item) => {
    container.append(
      createTabButton({
        label: item.label,
        isActive: item.id === activeId,
        onClick: () => onSelect(item.id),
      })
    );
  });
}

function renderToolbar(view) {
  toolbarHost.innerHTML = "";
  const toolbar = createToolbar(createEditorCommands(view));
  toolbarHost.append(toolbar);
}

function renderCanvas() {
  canvas.innerHTML = "";
  clearViews();
  clearInteractions();

  let didMountToolbar = false;
  const activeBlocks = blocks.filter(
    (block) => block.languageId === state.activeLanguageId
  );

  documentData.pages.forEach((page) => {
    const pageWrapper = document.createElement("div");
    pageWrapper.className = "page-shell";

    const { width, height } = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );

    const pageHeader = document.createElement("div");
    pageHeader.className = "mb-2 flex items-center justify-between text-xs text-slate-500";
    pageHeader.textContent = page.name;
    pageWrapper.append(pageHeader);

    const pageSurface = document.createElement("div");
    pageSurface.className = documentData.grid.snap
      ? "page-surface grid-on"
      : "page-surface";
    pageSurface.style.width = `${width}px`;
    pageSurface.style.height = `${height}px`;
    pageSurface.style.setProperty("--grid-size", `${documentData.grid.size}px`);
    pageWrapper.append(pageSurface);

    const pageBlocks = activeBlocks.filter((block) => block.pageId === page.id);

    if (pageBlocks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "absolute inset-0 flex items-center justify-center text-sm text-slate-300";
      empty.textContent = "Sem blocos";
      pageSurface.append(empty);
    }

    pageBlocks.forEach((block) => {
      const { element, editorHost } = createBlockElement(block);
      pageSurface.append(element);

      if (editorHost) {
        const view = createEditor({ mount: editorHost });
        state.views.push(view);

        if (!didMountToolbar && page.id === state.activePageId) {
          renderToolbar(view);
          didMountToolbar = true;
        }
      }

      const cleanup = setupDragResize({
        element,
        block,
        gridSize: documentData.grid.size,
        snapEnabled: documentData.grid.snap,
      });
      state.interactions.push(cleanup);
    });

    canvas.append(pageWrapper);
  });

  if (!didMountToolbar) {
    toolbarHost.innerHTML = "";
  }
}

function renderMeta() {
  const pageIndex = documentData.pages.findIndex(
    (page) => page.id === state.activePageId
  );
  pageMeta.textContent =
    `Pagina ${pageIndex + 1} de ${documentData.pages.length} ` +
    `(${documentData.page.format}, ${documentData.page.orientation}) ` +
    `Grid ${documentData.grid.size}px ${documentData.grid.snap ? "On" : "Off"}`;
}

function render() {
  formatSelect.value = documentData.page.format;
  orientationSelect.value = documentData.page.orientation;
  gridSizeInput.value = documentData.grid.size;
  snapToggle.checked = documentData.grid.snap;

  renderTabs(
    pageTabsHost,
    documentData.pages.map((page) => ({ id: page.id, label: page.name })),
    state.activePageId,
    (id) => {
      state.activePageId = id;
      render();
    }
  );

  renderTabs(
    languageTabsHost,
    documentData.languages.map((language) => ({
      id: language.id,
      label: language.label,
    })),
    state.activeLanguageId,
    (id) => {
      state.activeLanguageId = id;
      render();
    }
  );

  renderCanvas();
  renderMeta();
}

formatSelect.value = documentData.page.format;
orientationSelect.value = documentData.page.orientation;
gridSizeInput.value = documentData.grid.size;
snapToggle.checked = documentData.grid.snap;

formatSelect.addEventListener("change", (event) => {
  documentData.page.format = event.target.value;
  renderMeta();
});

orientationSelect.addEventListener("change", (event) => {
  documentData.page.orientation = event.target.value;
  renderMeta();
});

gridSizeInput.addEventListener("change", (event) => {
  documentData.grid.size = normalizeGridSize(event.target.value, 8);
  renderCanvas();
  renderMeta();
});

snapToggle.addEventListener("change", (event) => {
  documentData.grid.snap = event.target.checked;
  renderCanvas();
  renderMeta();
});

addImageButton.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const blocksForPage = blocks.filter(
    (block) =>
      block.pageId === state.activePageId &&
      block.languageId === state.activeLanguageId
  );
  const pageSize = getPageSize(
    documentData.page.format,
    documentData.page.orientation
  );
  const position = getNextBlockPosition({
    blocksForPage,
    blockSize: { width: 520, height: 360 },
    pageSize,
  });

  const block = await createImageBlockFromFile(file, {
    pageId: state.activePageId,
    languageId: state.activeLanguageId,
    position,
    pageSize,
  });

  blocks.push(block);
  renderCanvas();
  imageInput.value = "";
});

document.addEventListener("paste", async (event) => {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) {
    return;
  }

  const file = imageItem.getAsFile();
  if (!file) {
    return;
  }

  event.preventDefault();

  const blocksForPage = blocks.filter(
    (block) =>
      block.pageId === state.activePageId &&
      block.languageId === state.activeLanguageId
  );
  const pageSize = getPageSize(
    documentData.page.format,
    documentData.page.orientation
  );
  const position = getNextBlockPosition({
    blocksForPage,
    blockSize: { width: 520, height: 360 },
    pageSize,
  });

  const block = await createImageBlockFromFile(file, {
    pageId: state.activePageId,
    languageId: state.activeLanguageId,
    position,
    pageSize,
  });

  blocks.push(block);
  renderCanvas();
});

render();
