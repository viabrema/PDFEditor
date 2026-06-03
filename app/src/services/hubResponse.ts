/** Extrai texto de respostas JSON do Hub IA (vários formatos de deploy). */
export function resolveHubResponseText(data: unknown): string {
  if (data == null) {
    return "";
  }
  if (typeof data === "string") {
    return data.trim();
  }
  if (typeof data !== "object") {
    return "";
  }

  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.actions)) {
    return JSON.stringify(obj);
  }

  const fields = ["answer", "text", "response", "output", "message", "result", "content"];
  for (const key of fields) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  if (obj.data != null) {
    const nested = resolveHubResponseText(obj.data);
    if (nested) {
      return nested;
    }
  }

  return "";
}

export function resolveHubChatId(data: unknown, fallback: string | null | undefined) {
  if (!data || typeof data !== "object") {
    return fallback || null;
  }
  const obj = data as Record<string, unknown>;
  const id = obj.chatId ?? obj.chat_id;
  if (typeof id === "string" && id.trim()) {
    return id.trim();
  }
  if (obj.data && typeof obj.data === "object") {
    const nested = (obj.data as Record<string, unknown>).chatId ?? (obj.data as Record<string, unknown>).chat_id;
    if (typeof nested === "string" && nested.trim()) {
      return nested.trim();
    }
  }
  return fallback || null;
}
