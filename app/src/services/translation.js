export function createTranslationService({ endpoint, fetcher } = {}) {
  if (!endpoint) {
    throw new Error("Translation endpoint is required.");
  }

  const request = fetcher || fetch;

  return {
    async translateText({ text, sourceLang, targetLang }) {
      const response = await request(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
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
      };
    },
  };
}
