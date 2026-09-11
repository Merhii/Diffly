import { UploadCloud } from "lucide-react";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { useDiff } from "../context/DiffContext";

export default function DropZone() {
  const { loadDiff } = useDiff();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      loadDiff(text, file.name);
    },
    [loadDiff],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-8 py-12 text-center transition-colors ${
        isDragging ? "border-accent bg-accent-muted" : "border-border-strong bg-surface"
      }`}
    >
      <UploadCloud className="h-8 w-8 text-text-faint" strokeWidth={1.5} />
      <p className="text-sm text-text-muted">
        Drag and drop a <code className="font-mono text-text">.diff</code> or{" "}
        <code className="font-mono text-text">.patch</code> file here
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
      >
        Browse files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".diff,.patch,.txt"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
