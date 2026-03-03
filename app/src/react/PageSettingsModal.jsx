import React, { useEffect, useState } from "react";

export function PageSettingsModal({ documentData, state, onUpdate }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if (event.detail === "open-page-settings") {
        setOpen(true);
      }
    };
    window.addEventListener("app:event", handler);
    return () => window.removeEventListener("app:event", handler);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-40 ${open ? "flex" : "hidden"} items-center justify-center bg-slate-900/40 px-4`}
      role="dialog"
      aria-modal="true"
      aria-hidden={open ? "false" : "true"}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Configuracao da pagina
            </div>
            <div className="text-xs text-slate-500">Formato, orientacao e grid</div>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
            onClick={() => setOpen(false)}
          >
            Fechar
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Formato
            </label>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={documentData.page.format}
              onChange={(event) => {
                documentData.page.format = event.target.value;
                onUpdate();
              }}
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Orientacao
            </label>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={documentData.page.orientation}
              onChange={(event) => {
                documentData.page.orientation = event.target.value;
                onUpdate();
              }}
            >
              <option value="portrait">Retrato</option>
              <option value="landscape">Paisagem</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Grid
            </label>
            <input
              type="number"
              min="4"
              max="40"
              step="1"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={documentData.grid.size}
              onChange={(event) => {
                documentData.grid.size = Number(event.target.value);
                onUpdate();
              }}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={documentData.grid.snap}
              onChange={(event) => {
                documentData.grid.snap = event.target.checked;
                onUpdate();
              }}
            />
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Snap
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={documentData.regions?.header?.enabled ?? true}
              onChange={(event) => {
                documentData.regions.header.enabled = event.target.checked;
                if (!event.target.checked && state.activeRegion === "header") {
                  state.activeRegion = "body";
                  state.selectedBlockId = null;
                  state.editingBlockId = null;
                }
                onUpdate();
              }}
            />
            Exibir cabecalho
          </label>
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={documentData.regions?.footer?.enabled ?? true}
              onChange={(event) => {
                documentData.regions.footer.enabled = event.target.checked;
                if (!event.target.checked && state.activeRegion === "footer") {
                  state.activeRegion = "body";
                  state.selectedBlockId = null;
                  state.editingBlockId = null;
                }
                onUpdate();
              }}
            />
            Exibir rodape
          </label>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pagina ativa
          </span>
          <div>
            Pagina {documentData.pages.findIndex((page) => page.id === state.activePageId) + 1}
          </div>
        </div>
      </div>
    </div>
  );
}
