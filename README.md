# Diffly

A GitHub-PR-style diff viewer that opens from your terminal with a single
command (see [CLI](#cli) below) — for you, or for a coding agent handing off
a diff it just generated. Everything is parsed and rendered entirely
client-side; nothing you load is ever sent anywhere.

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

## CLI

`bin/diffly.js` opens Diffly with a diff already loaded — no manual
drag-drop/paste — so a coding agent or a developer can jump straight to a
review. It serves the already-built `dist/` from a local server on an
ephemeral port and opens your default browser; nothing leaves the machine
and there's no size limit on the diff.

Not published to npm yet, so today it's run from a clone:

```sh
npm run build          # bin/diffly.js serves dist/, so build first
node bin/diffly.js my.patch     # load a specific file
git diff | node bin/diffly.js   # pipe a diff in
node bin/diffly.js              # no argument or pipe: uses `git diff`,
                                 # falling back to `git diff --staged`
```

Or run `npm link` once to get a global `diffly` command on this machine
(`diffly my.patch`, `git diff | diffly`, bare `diffly`).
