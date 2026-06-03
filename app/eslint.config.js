import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const testFiles = ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**"];

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.ts"],
    ignores: testFiles,
    rules: {
      "max-lines": [
        "error",
        {
          max: 300,
          skipBlankLines: false,
          skipComments: false,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    files: testFiles,
    rules: {
      "max-lines": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
);
