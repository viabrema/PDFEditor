import { resolveHubResponseText } from "./hubResponse";

export function createTranslationService({
  endpoint,
  apiKey,
  fetcher,
  provider,
  model,
} = {} as any) {
  if (!endpoint) {
    throw new Error("Translation endpoint is required.");
  }
  if (!apiKey) {
    throw new Error("Translation api key is required.");
  }

  const request = fetcher || fetch;
  const resolvedProvider = provider || "GEMINI-2";
  const resolvedModel = model || "gemini-2.5-flash-lite";

  function buildPrompt({ text, sourceLang, targetLang }) {
    return [
      `Traduza do ${sourceLang} para ${targetLang}.`,
      "Retorne apenas a traducao, sem aspas.",
      "Texto:",
      text,
    ].join("\n");
  }

  async function sendPrompt(prompt) {
    const response = await request(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        provider: resolvedProvider,
        model: resolvedModel,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: {
          message: "Translation failed",
          status: response.status,
        },
      };
    }

    const data = await response.json();
    return {
      ok: true,
      data,
      text: resolveHubResponseText(data),
    };
  }

  return {
    async translateText({ text, sourceLang, targetLang }) {
      const prompt = buildPrompt({ text, sourceLang, targetLang });
      return sendPrompt(prompt);
    },
    async translatePrompt({ prompt }) {
      return sendPrompt(prompt);
    },
  };
}
