import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(["dist", "trash"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "off",
      "react-variable/prefer-const": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": 0,
      "@typescript-eslint/no-unused-expressions": 0,
      "no-console": "off",
      "no-explicit-any": 0,
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/rules-of-hooks": "off",
      // The route comes from react-router's useLocation(), never the browser's
      // global: it misses a basename and MemoryRouter in tests.
      "no-restricted-globals": [
        "error",
        { name: "location", message: "Use useLocation() from react-router." },
      ],
    },
  },
  // Code under src imports by relative path; `@/` is for tests only (CLAUDE.md §6).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/*"], message: "Code under src uses relative paths; @/ is for tests." },
          ],
        },
      ],
    },
  },
]);
