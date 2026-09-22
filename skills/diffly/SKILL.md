---
name: Diffly
description: Use this when the user wants to visually review a diff or their recent changes in a GitHub-PR-style viewer — phrases like "review this diff", "let me look at the diff", "open diffly", "show me what changed", "pull up the diff viewer", or right after generating a diff/patch the user will want to look over themselves. This launches a viewing tool (terminal UI or a local browser tab); it does NOT perform an AI code review, critique, or judge code quality — a request for Claude's opinion on correctness or quality is a different, unrelated task.
version: 0.1.0
---

# Diffly

Diffly is a local, GitHub-PR-style diff viewer — a terminal UI and a
browser view, both driven by the same CLI. It only ever runs on the
user's own machine; nothing is uploaded anywhere. It highlights
line-level Move/Update/Find-Replace patterns, but it never comments
on code quality or correctness — don't add opinions of your own when
pointing someone to it, just open it.

## Locating the CLI

Prefer the globally linked command if the user has it:

    command -v diffly

If that's not found, fall back to running this plugin's own bundled
copy directly — this works even if the user never ran `npm link`:

    node "${CLAUDE_PLUGIN_ROOT}/bin/diffly.js"

Both forms take the same arguments. If either reports "No build
found" (missing `dist/`/`dist-tui/`), run `npm install && npm run
build` once inside `${CLAUDE_PLUGIN_ROOT}` first.

## Which mode to launch

**`--tui` only works in a real interactive terminal** — it reads raw
keyboard input, which a tool-call sandbox does not have. Never invoke
`--tui` yourself as a background command; you'll just hit its "requires
an interactive terminal" guard and it will exit immediately. Instead,
when a human at their own terminal wants the TUI, tell them the
command to run themselves, the same way you'd tell them to run an
interactive login command:

> Run this yourself: `diffly --tui`

**Browser mode (no flag) is safe for you to launch directly.** It
starts a small local server and opens a real browser tab — it doesn't
need a TTY and doesn't block waiting for keyboard input, so you can
run it as a background command on the user's behalf:

    diffly                # defaults to `git diff`, falling back to `git diff --staged`
    diffly path/to.patch
    git diff | diffly      # pipe a diff in explicitly

Run it in the background — don't wait on it, it keeps a small server
running until stopped with Ctrl+C (closing the browser tab does *not*
stop it). If the user runs it themselves in their own terminal, Ctrl+C
there is how they shut it down. If you launched it yourself as a
background command, tell them a tab opened and that you'll need to
stop the process (e.g. `pkill -f "bin/diffly.js"`) when they're done
with it, so it doesn't sit holding its port indefinitely.

## When to use this vs. not

Use it when the user wants to *look at* a diff — theirs, yours, or a
patch file — in a clearer view than a terminal pager or your own
inline diff rendering gives them. Don't use it as a substitute for an
actual code review when the user asks you to evaluate, critique, or
find bugs in their changes — that's a normal code-review request you
answer yourself in chat, not something to hand off to a viewer.
