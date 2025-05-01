import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";


export default defineConfig([
  globalIgnores([
    "./api/__tests__/**",
    "./seed.js",
    "./test-db.js",
  ]),
  { 
    files: 
    ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"],
    languageOptions: { 
      globals: {
        ...globals.browser,
        process: "readonly",
        Buffer: "readonly",
       } }
  },
  { 
    rules: {
      "no-unused-vars": "warn",
    },
  },
]);