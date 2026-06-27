import js from "@eslint/js";
import globals from "globals";
import next from "eslint-plugin-next";
import react from "eslint-plugin-react";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    plugins: { react, next, "@typescript-eslint": ts },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // add rules here
    },
    ignores: ["node_modules"],
  },
];
