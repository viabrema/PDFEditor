import "./style.css";
import { createBlock } from "./blocks/blockModel.js";
import { createBlockElement } from "./blocks/blockRenderer.js";
import {
  createDocument,
  createLanguage,
  createPage,
} from "./editor/documentModel.js";
import { createEditor, createEditorCommands } from "./editor/editor.js";
import { createToolbar } from "./ui/toolbar.js";

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
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
        <div
          id="canvas"
          class="relative h-[520px] w-full overflow-hidden rounded-xl bg-slate-50"
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
const formatSelect = document.querySelector("#page-format");
const orientationSelect = document.querySelector("#page-orientation");

function clearViews() {
  state.views.forEach((view) => view.destroy());
  state.views = [];
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

  const activeBlocks = blocks.filter(
    (block) =>
      block.pageId === state.activePageId &&
      block.languageId === state.activeLanguageId
  );

  if (activeBlocks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "flex h-full items-center justify-center text-sm text-slate-400";
    empty.textContent = "Sem blocos nesta pagina";
    canvas.append(empty);
    toolbarHost.innerHTML = "";
    return;
  }

  activeBlocks.forEach((block, index) => {
    const { element, editorHost } = createBlockElement(block);
    canvas.append(element);

    const view = createEditor({ mount: editorHost });
    state.views.push(view);

    if (index === 0) {
      renderToolbar(view);
    }
  });
}

function renderMeta() {
  const pageIndex = documentData.pages.findIndex(
    (page) => page.id === state.activePageId
  );
  pageMeta.textContent =
    `Pagina ${pageIndex + 1} de ${documentData.pages.length} ` +
    `(${documentData.page.format}, ${documentData.page.orientation})`;
}

function render() {
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

formatSelect.addEventListener("change", (event) => {
  documentData.page.format = event.target.value;
  renderMeta();
});

orientationSelect.addEventListener("change", (event) => {
  documentData.page.orientation = event.target.value;
  renderMeta();
});

render();
