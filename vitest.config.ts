import { defineConfig } from "vitest/config";

// Everything under test is either pure logic or an Ink component rendered
// through ink-testing-library — both run in plain Node, no DOM involved.
export default defineConfig({
  test: {
    environment: "node",
  },
});
