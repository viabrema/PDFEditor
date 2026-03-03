export const PAGE_SIZES = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
};

export const TRANSLATION_KEY = "JygheDTXbNKNwA0DKL94riGK8AqxwtpyvCr2sfoQVfY";

export function getTranslationEndpoint() {
  return window.location.protocol.startsWith("http")
    ? "/api/ai/prompt"
    : "http://10.36.0.19:8080/api/ai/prompt";
}
