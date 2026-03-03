import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
