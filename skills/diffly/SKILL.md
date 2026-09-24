---
name: Diffly
description: Use this when the user wants to visually review a diff or their recent changes in a GitHub-PR-style viewer — phrases like "review this diff", "let me look at the diff", "open diffly", "show me what changed", "pull up the diff viewer", or right after generating a diff/patch the user will want to look over themselves. Diffly is a terminal UI the user runs themselves; it does NOT perform an AI code review, critique, or judge code quality — a request for Claude's opinion on correctness or quality is a different, unrelated task.
version: 0.2.0
---

# Diffly

Diffly is a GitHub-PR-style diff viewer that runs entirely in the
terminal — unified and side-by-side views, search, per-line comments,
and Move/Find-Replace annotations. It runs only on the user's own
machine; nothing is uploaded anywhere. It never comments on code
quality or correctness, so don't add opinions of your own when
pointing someone to it.

## You can't run it — hand the command to the user

**Diffly renders an interactive terminal UI and reads raw keyboard
input, which a tool-call sandbox does not have.** Running it yourself
just hits its "needs an interactive terminal" guard and exits. There
is no headless or browser mode to fall back on.

So when the user wants to look at a diff, give them the command to run
themselves, the same way you'd hand over an interactive login command:

> Run this yourself: `diffly`

Pick the invocation that matches what they want to see:

    diffly                 # defaults to `git diff`, falling back to `git diff --staged`
    diffly path/to.patch   # a specific patch file
    git diff main | diffly # pipe any diff in

If you've just generated changes yourself, bare `diffly` is almost
always the right suggestion — it picks up the working tree as-is.

## Locating the CLI

If the user reports `diffly: command not found`, they haven't linked
it. Either they run `npm link` once inside the repo, or they invoke
this plugin's bundled copy directly:

    node "${CLAUDE_PLUGIN_ROOT}/bin/diffly.js"

If that reports "No build found", run `npm install && npm run build`
once inside `${CLAUDE_PLUGIN_ROOT}` first — that part you can do
yourself, it's not interactive.

## Keys worth mentioning

`j`/`k` move, `s` toggles unified/side-by-side, `c` collapses a file,
`v` marks it viewed, `m` comments on a line, `/` searches, `?` shows
help, `q` quits. Comments and viewed-state persist per diff in
`~/.diffly/state.json`, so quitting and reopening the same diff picks
up where they left off.

## When to use this vs. not

Use it when the user wants to *look at* a diff — theirs, yours, or a
patch file — in a clearer view than a pager or your own inline diff
rendering gives them. Don't use it as a substitute for an actual code
review when the user asks you to evaluate, critique, or find bugs in
their changes — that's a normal code-review request you answer
yourself in chat, not something to hand off to a viewer.
