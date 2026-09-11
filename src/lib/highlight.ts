import Prism from "prismjs";

// Import order matters: each component extends grammars registered by ones
// imported before it (e.g. typescript extends javascript extends clike).
import "prismjs/components/prism-clike";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markdown";

Prism.manual = true;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Highlights a single line (or word-diff span) in isolation. Because each
 * call lacks surrounding file context, multi-line constructs (block
 * comments, multi-line strings/template literals) can misrender — an
 * accepted tradeoff for a line-oriented diff viewer.
 */
export function highlightLine(content: string, lang: string): string {
  const grammar = Prism.languages[lang];
  if (!grammar) return escapeHtml(content);
  try {
    return Prism.highlight(content, grammar, lang);
  } catch {
    return escapeHtml(content);
  }
}
