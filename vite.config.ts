import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /**
     * IPv4 loopback, explicitly.
     *
     * Vite's default is "localhost", which Node on Windows resolves to `::1` —
     * so the dev server binds IPv6 only. `adb reverse tcp:5173 tcp:5173`, which
     * is how a handheld reaches this server, connects upstream over
     * `127.0.0.1`, finds nothing listening and closes the socket: the device
     * shows ERR_EMPTY_RESPONSE with no hint that the two are on different
     * stacks.
     *
     * Still loopback, NOT the LAN — deliberately. A phone on `http://<lan-ip>`
     * is not a secure context, which leaves `navigator.mediaDevices` and
     * `navigator.userAgentData` both undefined: no camera scanning, and scan-gun
     * hardware detects as an ordinary phone. Over adb the origin is
     * `http://localhost`, which is trusted, and both work. Pass `--host` on the
     * command line if LAN access is ever genuinely wanted.
     */
    host: "127.0.0.1",
  },
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
