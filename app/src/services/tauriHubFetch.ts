/**
 * No Tauri, pedidos ao Hub IA passam pelo Rust (`hub_ia_prompt`) para evitar CORS.
 * No browser puro (Vite sem Tauri), devolve null e os serviços usam `fetch`.
 */
export function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Compatível com a assinatura de `fetch` usada pelos serviços; o retorno é um subconjunto de `Response`.
 * @returns {any}
 */
export function createTauriHubFetcher() {
  if (!isTauriRuntime()) {
    return null;
  }

  return async function tauriHubFetch(url: string, init: any = {}) {
    const { invoke } = await import("@tauri-apps/api/core");
    let bodyObj;
    try {
      bodyObj =
        typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    } catch {
      throw new Error("Corpo JSON invalido para Hub IA");
    }

    let apiKey = "";
    const h = init.headers;
    if (typeof Headers !== "undefined" && h instanceof Headers) {
      apiKey = h.get("x-api-key") || "";
    } else if (h && typeof h === "object") {
      apiKey = h["x-api-key"] || h["X-Api-Key"] || "";
    }

    const input: Record<string, unknown> = {
      url: String(url),
      apiKey,
      prompt: bodyObj.prompt,
      provider: bodyObj.provider,
      model: bodyObj.model,
    };
    if (bodyObj.chatId != null && bodyObj.chatId !== "") {
      input.chatId = bodyObj.chatId;
    }

    const out = (await invoke("hub_ia_prompt", { input })) as {
      status: number;
      body: unknown;
    };
    const ok = out.status >= 200 && out.status < 300;
    return {
      ok,
      status: out.status,
      json: async () => out.body,
    };
  };
}
