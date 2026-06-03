/** Fragmento HTML: area do canvas e rodape (painel lateral vem a seguir no template). */
export const APP_TEMPLATE_CANVAS_MARKUP = `
        <div class="workspace-canvas-column flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div class="flex min-h-0 flex-1 flex-col rounded-2xl border border-dashed border-slate-300 bg-white/70 p-2">
          <div
            id="canvas-scroll"
            class="min-h-0 flex-1 overflow-auto rounded-xl bg-slate-50"
          >
            <div class="flex min-h-full w-full flex-col items-center p-6">
              <div id="canvas-zoom-root" class="inline-block align-top">
                <div id="canvas" class="flex w-full flex-col gap-6"></div>
              </div>
            </div>
          </div>
        </div>
      <footer
        class="flex h-[30px] shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 text-xs text-slate-600"
        aria-label="Estado e zoom"
      >
        <span id="status-last-action" class="min-w-0 flex-1 truncate">Pronto.</span>
        <div class="flex shrink-0 items-center gap-1">
          <button
            id="zoom-out"
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-white font-semibold text-slate-700"
            title="Diminuir zoom"
            aria-label="Diminuir zoom"
          >
            −
          </button>
          <input
            id="zoom-input"
            type="text"
            inputmode="numeric"
            class="h-6 w-[3.25rem] rounded border border-slate-300 bg-white px-1 text-center text-xs"
            value="100%"
            aria-label="Nivel de zoom em percentagem"
          />
          <button
            id="zoom-in"
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-white font-semibold text-slate-700"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>
      </footer>
        </div>
        </div>
`;
