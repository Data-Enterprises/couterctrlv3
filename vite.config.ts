import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
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
      ],
    },
    pool: "threads",
  },
} as UserConfig);
