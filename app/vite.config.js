import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api/ai/prompt": {
        target: "http://10.36.0.19:8080",
        changeOrigin: true,
        secure: false,
      },
      "/api/ai": {
        target: "http://10.36.0.19:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
