import { useDiff } from "../context/DiffContext";
import BrandMark from "./BrandMark";
import DropZone from "./DropZone";
import ErrorBanner from "./ErrorBanner";
import PasteDiffPanel from "./PasteDiffPanel";

export default function WelcomeScreen() {
  const {
    state: { loadError },
    clearDiff,
  } = useDiff();

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <BrandMark className="h-7 w-7 text-text" />
            <h1 className="text-2xl font-semibold tracking-tight text-text">Diffly</h1>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            Read a .diff or .patch file with syntax highlighting, side-by-side comparison, and search
            — entirely in your browser. Nothing you load here is uploaded anywhere.
          </p>
        </div>

        {loadError && (
          <div className="mb-4">
            <ErrorBanner message={loadError} onDismiss={clearDiff} />
          </div>
        )}

        <DropZone />

        <div className="my-6 flex items-center gap-3 text-xs text-text-faint">
          <div className="h-px flex-1 bg-border" />
          or paste diff text
          <div className="h-px flex-1 bg-border" />
        </div>

        <PasteDiffPanel />
      </div>
    </div>
  );
}
