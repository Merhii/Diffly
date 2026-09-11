import { X } from "lucide-react";

export default function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-diff-del-border bg-diff-del-bg px-4 py-3 text-sm text-diff-del-text">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
