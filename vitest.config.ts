import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      // String keys prefix-match: "@" → src/ for the @/* path alias.
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // "server-only"/"client-only" are Next.js bundler directives that
      // don't resolve under vitest — point them at empty stubs.
      {
        find: "server-only",
        replacement: fileURLToPath(
          new URL("./src/test/stubs/server-only.ts", import.meta.url),
        ),
      },
      {
        find: "client-only",
        replacement: fileURLToPath(
          new URL("./src/test/stubs/client-only.ts", import.meta.url),
        ),
      },
      // The real sheets repo throws at import time without Sheets env vars
      // (imported relatively from repository.ts — regex must match the whole
      // specifier, since replace() swaps only the matched part).
      // Unit tests must never touch real Sheets anyway.
      {
        find: /^\.{1,2}\/sheets\/google-sheets-repository$/,
        replacement: fileURLToPath(
          new URL("./src/test/stubs/sheets-repository.ts", import.meta.url),
        ),
      },
    ],
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
      exclude: ["src/components/ui/**", "src/**/*.omc/**"],
      reporter: ["text", "html"],
      // Coverage is a signal, not a gate — no thresholds configured.
    },
  },
});
