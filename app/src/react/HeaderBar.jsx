import React from "react";

export function HeaderBar({ documentData, docStatus, onOpen, onSave, onExport }) {
  const emitAppEvent = (detail) => {
    window.dispatchEvent(new CustomEvent("app:event", { detail }));
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">PDF Editor</h1>
          <p className="text-sm text-slate-600">Editor em modo rascunho</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
            title="Abrir documento"
            aria-label="Abrir documento"
            onClick={onOpen}
          >
            <i data-lucide="folder-open"></i>
          </button>
          <button
            type="button"
            className="icon-button rounded-md bg-slate-900 text-white"
            title="Salvar documento"
            aria-label="Salvar documento"
            onClick={onSave}
          >
            <i data-lucide="save"></i>
          </button>
          <button
            type="button"
            className="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
            title="Exportar PDF"
            aria-label="Exportar PDF"
            onClick={onExport}
          >
            <i data-lucide="file-down"></i>
          </button>
          <button
            type="button"
            className="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
            title="Configuracao da pagina"
            aria-label="Configuracao da pagina"
            onClick={() => emitAppEvent("open-page-settings")}
          >
            <i data-lucide="settings-2"></i>
          </button>
          <button
            type="button"
            className="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
            title="Abrir AI"
            aria-label="Abrir AI"
            onClick={() => emitAppEvent("open-ai")}
          >
            <i data-lucide="sparkles"></i>
          </button>
          <div className="text-xs text-slate-500">
            {docStatus ? `${docStatus} · ` : ""}
            {documentData.title}
          </div>
        </div>
      </div>
    </header>
  );
}
