const EXTENSION_TO_PRISM_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  json: "json",
  css: "css",
  scss: "css",
  less: "css",
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  java: "java",
  go: "go",
  rs: "rust",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cc: "cpp",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  sql: "sql",
};

export function getLanguageForPath(path: string | null): string {
  if (!path) return "plaintext";
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  const ext = match?.[1]?.toLowerCase();
  if (!ext) return "plaintext";
  return EXTENSION_TO_PRISM_LANGUAGE[ext] ?? "plaintext";
}
