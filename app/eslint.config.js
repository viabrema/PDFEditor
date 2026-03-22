import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    files: [
      "src/app/aiApply.ts",
      "src/app/appTemplate.ts",
      "src/app/chartModal.ts",
      "src/blocks/chartSpecToChartJs.ts",
      "src/blocks/dragResize.test.ts",
      "src/services/export.basic.test.ts",
      "src/services/export.ts",
    ],
    rules: { "max-lines": "off" },
  },
);
