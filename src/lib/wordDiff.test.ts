import { describe, expect, it } from "vitest";
import { computeWordDiff } from "./wordDiff";

describe("computeWordDiff", () => {
  it("marks nothing changed for identical lines", () => {
    const { oldSpans, newSpans } = computeWordDiff("const x = 1;", "const x = 1;");
    expect(oldSpans.every((span) => !span.changed)).toBe(true);
    expect(newSpans.every((span) => !span.changed)).toBe(true);
  });

  it("isolates a single-word change", () => {
    const { oldSpans, newSpans } = computeWordDiff("return a + b;", "return a - b;");
    expect(oldSpans.filter((span) => span.changed)).toHaveLength(1);
    expect(newSpans.filter((span) => span.changed)).toHaveLength(1);
    expect(oldSpans.find((span) => span.changed)?.text).toContain("+");
    expect(newSpans.find((span) => span.changed)?.text).toContain("-");
  });

  it("treats a fully different line as one changed span per side", () => {
    const { oldSpans, newSpans } = computeWordDiff("foo bar", "completely different");
    expect(oldSpans.some((span) => span.changed)).toBe(true);
    expect(newSpans.some((span) => span.changed)).toBe(true);
  });

  it("detects a whitespace-only change", () => {
    const { oldSpans, newSpans } = computeWordDiff("a  b", "a b");
    const oldChanged = oldSpans.some((span) => span.changed);
    const newChanged = newSpans.some((span) => span.changed);
    expect(oldChanged || newChanged).toBe(true);
  });
});
