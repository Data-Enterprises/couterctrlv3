import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Test discovery defaults to the whole repo, so a spec parked in `trash/`
    // during the dev/prod separation would still run — against code nothing
    // imports any more.
    exclude: ["**/node_modules/**", "**/dist/**", "trash/**"],
    setupFiles: "./src/vitest.setup.ts",
    globals: true,
    coverage: {
      enabled: true,
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      thresholds: {
        branches: 0,
      },
      exclude: [
        "src/main.tsx",
        "src/api/**",
        "src/components/toasts/**",
        "src/pages/upc/components/chartUtils.tsx",
        "src/pages/priceSimulator/**",
        "src/features/priceSimSlice.ts",
        "src/pages/forecast/controls/UpcUploader.tsx",
        "src/pages/forecast/grids/PriceHistoryGrid.tsx",
        "src/functions/**",
        "src/pages/forecast/ReplayModal.tsx",
        "src/pages/upcList/**",
        "src/pages/team/assignModal/QuicksightStores.tsx",
        "src/pages/team/assignModal/QsAssigned.tsx",
        "src/pages/team/assignModal/QsUnassigned.tsx",
        "src/pages/upc/**"
      ],
    },
    pool: "threads",
  },
} as UserConfig);
