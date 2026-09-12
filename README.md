# Diffly

A standalone, browser-only viewer for `.diff`/`.patch` files. Drag and drop a
file, pick one from disk, or paste diff text — everything is parsed and
rendered entirely client-side. Nothing you load is ever sent anywhere.

Features: unified and side-by-side views, syntax highlighting, word-level
highlighting of changed text within a modified line, search across file
content and filenames, per-file expand/collapse, and a persisted dark/light
theme.

This is a viewer only — no GitHub/GitLab integration and no AI review.

## Development

```sh
npm install
npm run dev
```

Run the test suite (parser, line-pairing, and word-diff logic):

```sh
npm run test
```

## Build

```sh
npm run build
npm run preview   # serve the production build locally
```

Output goes to `dist/`.

## Deploying

This is a pure static bundle with no server or API — any static host works
with zero configuration. Vercel, Netlify, and Cloudflare Pages all
auto-detect a Vite project and deploy `dist/` directly.

GitHub Pages is the one exception: for a project page (not a user/org root
page) you need to set `base: '/<repo-name>/'` in `vite.config.ts` before
building.
