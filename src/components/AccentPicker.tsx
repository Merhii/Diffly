import { useDiff } from "../context/DiffContext";
import type { Accent } from "../types";

const ACCENTS: { value: Accent; label: string; swatch: string }[] = [
  { value: "indigo", label: "Indigo accent", swatch: "#4f5fff" },
  { value: "teal", label: "Teal accent", swatch: "#0f8b8b" },
  { value: "amber", label: "Amber accent", swatch: "#b45309" },
];

export default function AccentPicker() {
  const {
    state: { accent },
    setAccent,
  } = useDiff();

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-md border border-border px-1.5 py-1">
      {ACCENTS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setAccent(option.value)}
          aria-label={option.label}
          aria-pressed={accent === option.value}
          className={`h-4 w-4 rounded-full ${
            accent === option.value ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""
          }`}
          style={{ backgroundColor: option.swatch }}
        />
      ))}
    </div>
  );
}
