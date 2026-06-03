import { HUB_AI_MODEL, HUB_AI_PROVIDER } from "../app/config";
import {
  getDefaultHubAiModel,
  getDefaultHubAiProvider,
  normalizeHubAiSelection,
} from "./hubAiCatalog";

const STORAGE_KEY = "pdfeditor.hubAi";

export type HubAiRuntimeConfig = {
  provider: string;
  model: string;
};

function envDefaults(): HubAiRuntimeConfig {
  return normalizeHubAiSelection(HUB_AI_PROVIDER, HUB_AI_MODEL);
}

function readStorage(): Partial<HubAiRuntimeConfig> | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<HubAiRuntimeConfig>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(config: HubAiRuntimeConfig) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function loadHubAiRuntimeConfig(): HubAiRuntimeConfig {
  const stored = readStorage();
  if (stored?.provider) {
    return normalizeHubAiSelection(stored.provider, stored.model);
  }
  return envDefaults();
}

export function createHubAiRuntime(initial?: Partial<HubAiRuntimeConfig>) {
  let config = normalizeHubAiSelection(
    initial?.provider ?? loadHubAiRuntimeConfig().provider,
    initial?.model ?? loadHubAiRuntimeConfig().model,
  );

  return {
    get(): HubAiRuntimeConfig {
      return { ...config };
    },
    set(next: Partial<HubAiRuntimeConfig>) {
      config = normalizeHubAiSelection(
        next.provider ?? config.provider,
        next.model ?? config.model,
      );
      writeStorage(config);
      return config;
    },
    setProvider(provider: string) {
      const models = normalizeHubAiSelection(provider, config.model);
      config = { provider: models.provider, model: models.model };
      writeStorage(config);
      return config;
    },
    setModel(model: string) {
      config = normalizeHubAiSelection(config.provider, model);
      writeStorage(config);
      return config;
    },
  };
}
