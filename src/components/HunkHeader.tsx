export default function HunkHeader({ header }: { header: string }) {
  return (
    <div className="bg-hunk-bg px-3 py-1 font-mono text-xs text-hunk-text">{header}</div>
  );
}
