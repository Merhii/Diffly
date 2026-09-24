import { describe, expect, it } from "vitest";
import { hashDiffText } from "./diffStore";

// Only hashDiffText is covered here: loadDiffRecord/writeDiffRecord touch the
// real ~/.diffly directory, so exercising them in a unit test would write to
// the machine running it. The TUI's own tests stub the module instead.
describe("hashDiffText", () => {
  it("is stable for identical input", () => {
    expect(hashDiffText("diff --git a/x b/x")).toBe(hashDiffText("diff --git a/x b/x"));
  });

  it("differs for different input", () => {
    expect(hashDiffText("a")).not.toBe(hashDiffText("b"));
  });

  it("returns a fixed-width hex string", () => {
    expect(hashDiffText("")).toMatch(/^[0-9a-f]{8}$/);
    expect(hashDiffText("some longer diff text with several lines\n+added\n-removed")).toMatch(/^[0-9a-f]{8}$/);
  });
});
