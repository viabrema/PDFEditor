export const PAGE_SIZES = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
};

/**
 * Base do Hub IA (sem barra final).
 * Usa **https** por defeito: se apontares para `http://...` e o servidor redireccionar para HTTPS
 * (301/302), o cliente ao seguir o redirect pode trocar POST por GET → Express responde
 * `Cannot GET /ai/prompt`. Para um hub só em HTTP local, define `VITE_AI_API_ORIGIN=http://...`.
 */
export const AI_API_ORIGIN = (
  typeof import.meta !== "undefined" && import.meta.env?.VITE_AI_API_ORIGIN
    ? String(import.meta.env.VITE_AI_API_ORIGIN)
    : "https://backend-hubia.cmadev.io"
).replace(/\/$/, "");

export const TRANSLATION_KEY = "JygheDTXbNKNwA0DKL94riGK8AqxwtpyvCr2sfoQVfY";

const DEFAULT_PROMPT_PATH = "/ai/prompt";

function viteEnvString(key) {
  if (typeof import.meta === "undefined" || import.meta.env?.[key] == null) {
    return "";
  }
  const s = String(import.meta.env[key]).trim();
  return s;
}

function normalizePromptPath(raw) {
  const p = raw || DEFAULT_PROMPT_PATH;
  return p.startsWith("/") ? p : `/${p}`;
}

/**
 * URL absoluta do POST do Hub IA (não usa `localhost:5173/api/...` por defeito).
 *
 * Ordem: `VITE_AI_PROMPT_URL` (URL completa) → senão `AI_API_ORIGIN` + `VITE_AI_PROMPT_PATH`
 * (ou `/ai/prompt`). Se o servidor responder `Cannot POST /...`, o path não existe nesse
 * deploy — confirma com a equipa do backend e ajusta o `.env`.
 */
export function getTranslationEndpoint() {
  const full = viteEnvString("VITE_AI_PROMPT_URL");
  if (full) {
    return full.replace(/\/$/, "");
  }
  const path = normalizePromptPath(viteEnvString("VITE_AI_PROMPT_PATH"));
  return `${AI_API_ORIGIN}${path}`;
}
