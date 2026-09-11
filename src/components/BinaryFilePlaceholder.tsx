import { FileWarning } from "lucide-react";

export default function BinaryFilePlaceholder() {
  return (
    <div className="flex items-center gap-2 px-4 py-6 text-sm text-text-muted">
      <FileWarning className="h-4 w-4" strokeWidth={1.5} />
      Binary file not shown
    </div>
  );
}
