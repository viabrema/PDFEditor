import "./style.css";
import { createBlock } from "./blocks/blockModel.js";
import { createBlockElement } from "./blocks/blockRenderer.js";
import { createDocument } from "./editor/documentModel.js";
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
});
const activePageId = documentData.pages[0].id;
const block = createBlock({
  position: { x: 32, y: 32 },
  size: { width: 520, height: 220 },
  pageId: activePageId,
  languageId: documentData.activeLanguageId,
});

const canvas = document.querySelector("#canvas");
const { element, editorHost } = createBlockElement(block);
canvas.append(element);

const view = createEditor({ mount: editorHost });
const toolbar = createToolbar(createEditorCommands(view));
document.querySelector("#toolbar").append(toolbar);
