import { setLastAction } from "../activityLog";

export function bindAiEvents({ state, refs, renderer, aiFlow, aiService }) {
  refs.aiSend.addEventListener("click", async () => {
    const instruction = refs.aiInput.value.trim();
    if (!instruction) {
      return;
    }

    state.ai.history = [...state.ai.history, { role: "user", text: instruction }];
    refs.aiInput.value = "";
    state.ai.loading = true;
    state.ai.error = null;
    renderer.renderAiPanel();

    try {
      const mode = aiFlow.getModeForInstruction(instruction);
      const prompt = aiFlow.buildDocumentPrompt({ instruction, mode });
      const chatKey = aiFlow.getChatKey();
      const chatId = state.ai.chatByBlockId[chatKey];
      const result = await aiService.sendPrompt({ prompt, chatId });
      if (!result.ok) {
        state.ai.history = [
          ...state.ai.history,
          { role: "assistant", text: "Nao foi possivel obter resposta do servico de IA." },
        ];
        state.ai.error = "Falha ao gerar resposta.";
        setLastAction(state, "AI: falha na resposta.");
        return;
      }

      if (result.chatId) {
        state.ai.chatByBlockId[chatKey] = result.chatId;
      }

      const assistantText = result.text?.trim() ? result.text : "(resposta vazia)";
      state.ai.history = [...state.ai.history, { role: "assistant", text: assistantText }];

      if (mode === "analysis") {
        setLastAction(state, "AI: analise recebida.");
        return;
      }

      const applied = aiFlow.applyAiResultToPage({ resultText: result.text || "" });
      if (!applied) {
        state.ai.error = "Resposta invalida ou sem acoes aplicaveis (esperado JSON com actions).";
        setLastAction(state, "AI: resposta nao aplicada.");
      } else {
        setLastAction(state, "AI: alteracoes aplicadas.");
        renderer.render();
      }
    } catch (error) {
      state.ai.history = [
        ...state.ai.history,
        { role: "assistant", text: "Ocorreu um erro ao contactar a IA." },
      ];
      state.ai.error = "Falha ao gerar resposta.";
      setLastAction(state, "AI: erro.");
    } finally {
      state.ai.loading = false;
      renderer.renderAiPanel();
    }
  });
}
