export function renderAiPanel({
  refs,
  state,
  documentData,
  aiFlow,
  requestRender,
}: {
  refs: any;
  state: any;
  documentData: any;
  aiFlow: { getSelectedBlocksInOrder: () => { id: string; type: string }[] };
  requestRender: () => void;
}) {
  refs.aiPanel.classList.toggle("is-open", state.ai.open);
  refs.aiPanel.setAttribute("aria-hidden", state.ai.open ? "false" : "true");

  const lang = documentData.languages.find((l: { id: string }) => l.id === state.activeLanguageId);
  refs.aiTarget.textContent =
    `Layout completo no idioma ${lang?.label ?? state.activeLanguageId}. ` +
    "Cmd ou Ctrl+clique para selecionar varios blocos.";

  const chipsHost = refs.aiSelectionChips as HTMLElement | null;
  if (chipsHost) {
    chipsHost.innerHTML = "";
    const ordered = aiFlow.getSelectedBlocksInOrder();
    chipsHost.classList.toggle("is-empty", ordered.length === 0);
    ordered.forEach((block: { id: string; type: string }, index: number) => {
      const row = document.createElement("div");
      row.className = "ai-selection-chip";
      const label = document.createElement("span");
      label.className = "ai-selection-chip-label";
      const shortId = block.id.length > 10 ? `…${block.id.slice(-8)}` : block.id;
      label.textContent = `#${index + 1} ${block.type} · ${shortId}`;
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "ai-selection-chip-remove";
      rm.setAttribute("aria-label", "Remover da selecao");
      rm.textContent = "×";
      rm.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.selectedBlockIds = state.selectedBlockIds.filter((id: string) => id !== block.id);
        requestRender();
      });
      row.append(label, rm);
      chipsHost.append(row);
    });
  }

  refs.aiSend.disabled = state.ai.loading;
  refs.aiStatus.textContent = state.ai.loading ? "Processando..." : state.ai.error || "";

  const historyHost = refs.aiHistory as HTMLElement | null;
  if (historyHost) {
    historyHost.innerHTML = "";
    const entries = state.ai.history || [];
    entries.forEach((entry: { role: string; text: string }) => {
      const wrap = document.createElement("div");
      wrap.className =
        entry.role === "user"
          ? "ai-history-msg ai-history-msg-user"
          : "ai-history-msg ai-history-msg-assistant";
      const roleEl = document.createElement("div");
      roleEl.className = "ai-history-msg-role";
      roleEl.textContent = entry.role === "user" ? "Voce" : "Assistente";
      const body = document.createElement("div");
      body.className = "ai-history-msg-body";
      body.textContent = entry.text;
      wrap.append(roleEl, body);
      historyHost.append(wrap);
    });
    if (state.ai.loading) {
      const pending = document.createElement("div");
      pending.className = "ai-history-msg ai-history-msg-assistant ai-history-msg-pending";
      const roleEl = document.createElement("div");
      roleEl.className = "ai-history-msg-role";
      roleEl.textContent = "Assistente";
      const body = document.createElement("div");
      body.className = "ai-history-msg-body";
      body.textContent = "A processar...";
      pending.append(roleEl, body);
      historyHost.append(pending);
    }
    requestAnimationFrame(() => {
      historyHost.scrollTop = historyHost.scrollHeight;
    });
  }
}
