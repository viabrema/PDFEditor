export type HubAiProviderOption = {
  id: string;
  label: string;
};

export type HubAiModelOption = {
  id: string;
  label: string;
};

export const HUB_AI_PROVIDER_OPTIONS: HubAiProviderOption[] = [
  { id: "openai", label: "OpenAI" },
  { id: "GEMINI-2", label: "Gemini 2" },
  { id: "gemini", label: "Gemini" },
];

/** Modelos Gemini aceites pelo Hub (providers `GEMINI-2` e `gemini`). */
export const HUB_GEMINI_MODEL_OPTIONS: HubAiModelOption[] = [
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

export const HUB_AI_MODELS_BY_PROVIDER: Record<string, HubAiModelOption[]> = {
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { id: "gpt-4.1", label: "GPT-4.1" },
  ],
  "GEMINI-2": HUB_GEMINI_MODEL_OPTIONS,
  gemini: HUB_GEMINI_MODEL_OPTIONS,
};

export function getDefaultHubAiProvider(): string {
  return HUB_AI_PROVIDER_OPTIONS[0].id;
}

export function getDefaultHubAiModel(providerId: string): string {
  const models = HUB_AI_MODELS_BY_PROVIDER[providerId];
  if (!models || models.length === 0) {
    return "gpt-4o-mini";
  }
  return models[0].id;
}

export function getModelsForHubAiProvider(providerId: string): HubAiModelOption[] {
  return HUB_AI_MODELS_BY_PROVIDER[providerId] || [];
}

export function isKnownHubAiProvider(providerId: string): boolean {
  return HUB_AI_PROVIDER_OPTIONS.some((p) => p.id === providerId);
}

export function normalizeHubAiSelection(
  providerId: string | undefined,
  modelId: string | undefined,
): { provider: string; model: string } {
  const provider = providerId && isKnownHubAiProvider(providerId) ? providerId : getDefaultHubAiProvider();
  const models = getModelsForHubAiProvider(provider);
  const model =
    modelId && models.some((m) => m.id === modelId) ? modelId : getDefaultHubAiModel(provider);
  return { provider, model };
}
