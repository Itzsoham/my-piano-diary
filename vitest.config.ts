import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Resolves the "@/*" and "@prisma/*" aliases from tsconfig.json.
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Router tests import the app router, which transitively loads env.js +
    // the Prisma singleton. Skip env validation and hand it a dummy URL so
    // those imports don't throw (the DB is mocked; nothing connects).
    env: {
      SKIP_ENV_VALIDATION: "true",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret",
    },
    coverage: {
      provider: "v8",
      // Measure coverage for the pure lib modules. No hard threshold gate yet —
      // add `thresholds: { lines: 80 }` here once src/lib is broadly covered.
      include: ["src/lib/**"],
    },
  },
});
