// react-devtools-core is an optional peer dependency Ink dynamically imports
// only when DEV=true (see ink/build/reconciler.js) — we never install it,
// since a terminal review tool has no use for the React DevTools bridge.
// esbuild still needs *something* to resolve that import statement to when
// bundling (an ES module import is a static declaration, not something
// esbuild can leave conditionally unresolved), so this no-op stub stands in
// via package.json's build:tui --alias flag.
export default {
  initialize() {},
  connectToDevTools() {},
};
