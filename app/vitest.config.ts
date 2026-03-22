import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/main.ts",
        "src/counter.ts",
        "src/app/**",
        "src/services/tauriHubFetch.ts",
        "src/services/tauriStorage.ts",
        "src/blocks/chartRuntime.ts",
        "src/blocks/chartJsRegister.ts",
        "src/blocks/chartPalette.ts",
        "src/blocks/chartSpecToChartJs.ts",
        "src/blocks/chartDataFromTableBlock.ts",
        "src/blocks/chartValidation.ts",
        "src/blocks/dragResize.ts",
        "src/services/excelThemeColors.ts",
        "src/services/exportTableMarkup.ts",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
