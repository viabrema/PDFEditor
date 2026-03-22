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
  const resolvedProvider = provider || "gemini";
  const resolvedModel = model || "gemini-2.5-flash-lite";

  function resolveText(data) {
    if (!data || typeof data !== "object") {
      return "";
    }
    return (
      data.answer ||
      data.text ||
      data.response ||
      data.output ||
      data.message ||
      data.result ||
      ""
    );
  }

  return {
    async sendPrompt({ prompt, chatId }) {
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

      if (!response.ok) {
        return {
          ok: false,
          error: {
            message: "AI request failed",
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return {
        ok: true,
        data,
        text: resolveText(data),
        chatId: data?.chatId || chatId || null,
      };
    },
  };
}
