import { resolveHubChatId, resolveHubResponseText } from "./hubResponse";

export function createAiService({
  endpoint,
  apiKey,
  fetcher,
  provider,
  model,
} = {} as any) {
  if (!endpoint) {
    throw new Error("AI endpoint is required.");
  }
  if (!apiKey) {
    throw new Error("AI api key is required.");
  }

  const request = fetcher || fetch;
  const resolvedProvider = provider || "GEMINI-2";
  const resolvedModel = model || "gemini-2.5-flash-lite";

  async function postPrompt(prompt: string, chatId: string | null | undefined) {
    const payload: Record<string, unknown> = {
      prompt,
      provider: resolvedProvider,
      model: resolvedModel,
    };
    if (chatId) {
      payload.chatId = chatId;
    }

    const response = await request(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data,
      text: resolveHubResponseText(data),
      chatId: resolveHubChatId(data, chatId),
      retriedWithoutChat: false as boolean,
    };
  }

  return {
    async sendPrompt({ prompt, chatId }) {
      let attempt = await postPrompt(prompt, chatId);
      if (!attempt.ok && chatId) {
        const retry = await postPrompt(prompt, null);
        if (retry.ok) {
          attempt = { ...retry, retriedWithoutChat: true };
        }
      }

      if (!attempt.ok) {
        return {
          ok: false,
          error: {
            message: "AI request failed",
            status: attempt.status,
          },
        };
      }

      return {
        ok: true,
        data: attempt.data,
        text: attempt.text,
        chatId: attempt.chatId,
        retriedWithoutChat: attempt.retriedWithoutChat || false,
      };
    },
  };
}
