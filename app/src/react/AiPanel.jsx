import React, { useEffect, useState } from "react";

export function AiPanel({ state, aiFlow, aiService, onUpdate }) {
  const [open, setOpen] = useState(state.ai.open);
  const [input, setInput] = useState("");

  useEffect(() => {
    const handler = (event) => {
      if (event.detail === "open-ai") {
        state.ai.open = true;
        setOpen(true);
      }
    };
    window.addEventListener("app:event", handler);
    return () => window.removeEventListener("app:event", handler);
  }, [state]);

  const handleSend = async () => {
    const selectedBlock = aiFlow.getSelectedBlock();
    const instruction = input.trim();
    if (!instruction) {
      return;
    }

    state.ai.loading = true;
    state.ai.error = null;
    state.ai.response = "";
    onUpdate();

    try {
      const mode = aiFlow.getModeForInstruction(instruction);
      const prompt = selectedBlock
        ? aiFlow.buildAiPrompt({ block: selectedBlock, instruction, mode })
        : aiFlow.buildPageAiPrompt({ instruction, mode });
      const chatKey = aiFlow.getChatKey(selectedBlock);
      const chatId = state.ai.chatByBlockId[chatKey];
      const result = await aiService.sendPrompt({ prompt, chatId });
      if (!result.ok) {
        state.ai.error = "Falha ao gerar resposta.";
        state.ai.loading = false;
        onUpdate();
        return;
      }

      if (result.chatId) {
        state.ai.chatByBlockId[chatKey] = result.chatId;
      }
      state.ai.response = result.text || "";

      if (mode === "analysis") {
        onUpdate();
        return;
      }

      const applied = selectedBlock
        ? aiFlow.applyAiResultToBlock({
            block: selectedBlock,
            resultText: result.text || "",
          })
        : aiFlow.applyAiResultToPage({ resultText: result.text || "" });
      if (!applied) {
        state.ai.error = "Resposta invalida para o tipo de bloco.";
      }
      onUpdate();
    } catch (error) {
      state.ai.error = "Falha ao gerar resposta.";
    } finally {
      state.ai.loading = false;
      onUpdate();
    }
  };

  return (
    <aside className={`ai-panel ${open ? "is-open" : ""}`} aria-hidden={open ? "false" : "true"}>
      <div className="ai-panel-header">
        <div className="text-sm font-semibold text-slate-900">AI Assistente</div>
        <button
          type="button"
          className="ai-panel-close"
          onClick={() => {
            state.ai.open = false;
            setOpen(false);
          }}
        >
          Fechar
        </button>
      </div>
      <div className="ai-panel-body">
        <div className="text-xs text-slate-500">
          {state.selectedBlockId ? "Bloco: text" : "Pagina ativa"}
        </div>
        <textarea
          className="ai-panel-input"
          rows={6}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Descreva o que deseja mudar..."
        ></textarea>
        <button type="button" className="ai-panel-send" onClick={handleSend}>
          Enviar
        </button>
        <div className="text-xs text-slate-500">
          {state.ai.loading ? "Processando..." : state.ai.error || ""}
        </div>
        <pre className="ai-panel-response">{state.ai.response || ""}</pre>
      </div>
    </aside>
  );
}
