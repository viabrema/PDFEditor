import { setLastAction } from "../activityLog";

export function bindAiEvents({ state, refs, renderer, aiFlow, aiService }) {
  refs.aiSend.addEventListener("click", async () => {
    const selectedBlock = aiFlow.getSelectedBlock();
    const instruction = refs.aiInput.value.trim();
    if (!instruction) {
      return;
    }

    state.ai.loading = true;
    state.ai.error = null;
    state.ai.response = "";
    renderer.renderAiPanel();

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
        setLastAction(state, "AI: falha na resposta.");
        renderer.renderAiPanel();
        return;
      }

      if (result.chatId) {
        state.ai.chatByBlockId[chatKey] = result.chatId;
      }
      state.ai.response = result.text || "";

      if (mode === "analysis") {
        setLastAction(state, "AI: analise recebida.");
        renderer.renderAiPanel();
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
        setLastAction(state, "AI: resposta nao aplicada.");
      } else {
        setLastAction(state, "AI: alteracoes aplicadas.");
      }
      renderer.render();
    } catch (error) {
      state.ai.error = "Falha ao gerar resposta.";
      setLastAction(state, "AI: erro.");
    } finally {
      state.ai.loading = false;
      renderer.renderAiPanel();
    }
  });
}
