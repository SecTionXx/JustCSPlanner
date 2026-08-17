import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "src/components/shell/**",
        "src/app/(app)/_components/**",
        "src/app/(app)/**/_components/**",
        "src/lib/utils.ts",
        "src/lib/labels.ts",
      ],
      exclude: ["src/components/ui/**"],
      reporter: ["text", "html"],
      // Coverage is a signal, not a gate — no thresholds configured.
    },
  },
});
