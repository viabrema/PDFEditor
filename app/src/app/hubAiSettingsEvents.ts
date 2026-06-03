import { setLastAction } from "./activityLog";
import { syncHubAiSettingsCombos } from "./hubAiSettingsUi";

export function bindHubAiSettingsEvents({
  refs,
  state,
  hubAiRuntime,
}: {
  refs: {
    hubAiProviderSelect: HTMLSelectElement | null;
    hubAiModelSelect: HTMLSelectElement | null;
  };
  state: { ai: { chatByBlockId: Record<string, string> } };
  hubAiRuntime: {
    get: () => { provider: string; model: string };
    setProvider: (provider: string) => { provider: string; model: string };
    setModel: (model: string) => { provider: string; model: string };
  };
}) {
  const providerSelect = refs.hubAiProviderSelect as HTMLSelectElement | null;
  const modelSelect = refs.hubAiModelSelect as HTMLSelectElement | null;
  if (!providerSelect || !modelSelect) {
    return;
  }

  syncHubAiSettingsCombos(providerSelect, modelSelect, hubAiRuntime.get());

  providerSelect.addEventListener("change", () => {
    const next = hubAiRuntime.setProvider(providerSelect.value);
    syncHubAiSettingsCombos(providerSelect, modelSelect, next);
    state.ai.chatByBlockId = {};
    setLastAction(state, `IA: ${next.provider} / ${next.model}`);
  });

  modelSelect.addEventListener("change", () => {
    const next = hubAiRuntime.setModel(modelSelect.value);
    state.ai.chatByBlockId = {};
    setLastAction(state, `IA: ${next.provider} / ${next.model}`);
  });
}
