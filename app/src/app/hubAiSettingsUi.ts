import {
  HUB_AI_PROVIDER_OPTIONS,
  getModelsForHubAiProvider,
} from "../services/hubAiCatalog";
import type { HubAiRuntimeConfig } from "../services/hubAiRuntime";

export function fillHubAiProviderSelect(select: HTMLSelectElement) {
  select.innerHTML = "";
  for (const option of HUB_AI_PROVIDER_OPTIONS) {
    const el = document.createElement("option");
    el.value = option.id;
    el.textContent = option.label;
    select.appendChild(el);
  }
}

export function fillHubAiModelSelect(select: HTMLSelectElement, providerId: string, modelId: string) {
  select.innerHTML = "";
  const models = getModelsForHubAiProvider(providerId);
  for (const option of models) {
    const el = document.createElement("option");
    el.value = option.id;
    el.textContent = option.label;
    select.appendChild(el);
  }
  if (models.some((m) => m.id === modelId)) {
    select.value = modelId;
  } else if (models[0]) {
    select.value = models[0].id;
  }
}

export function syncHubAiSettingsCombos(
  providerSelect: HTMLSelectElement | null,
  modelSelect: HTMLSelectElement | null,
  config: HubAiRuntimeConfig,
) {
  if (!providerSelect || !modelSelect) {
    return;
  }
  if (!providerSelect.options.length) {
    fillHubAiProviderSelect(providerSelect);
  }
  providerSelect.value = config.provider;
  fillHubAiModelSelect(modelSelect, config.provider, config.model);
}
