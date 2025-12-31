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
      exclude: [
        "src/main.tsx",
        "src/api/**",
        "src/components/toasts/**",
        "src/pages/upc/components/chartUtils.tsx",
        "src/pages/priceSimulator/**",
        "src/features/priceSimSlice.ts",
        "src/pages/forecast/controls/UpcUploader.tsx",
        "src/pages/forecast/grids/PriceHistoryGrid.tsx",
      ],
    },
  },
} as UserConfig);
