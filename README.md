# diffly

Tired of reviewing agentic changes in a slopped way? Try diffly.

A diff viewer that runs in your terminal — unified or side-by-side, with
search, per-line notes, and per-file viewed tracking.

## Install

    npm i -g @merhi/diffly

## Use

    diffly                  # your uncommitted changes (falls back to staged)
    diffly some.patch       # a patch file
    git diff main | diffly  # anything you can pipe in

## Keys

    j / k   move             s     unified / side-by-side
    c       collapse file    v     mark file viewed
    m       comment on line  d     delete that comment
    /       search           n/N   next / previous match
    ?       help             q     quit

## What it picks up

Agents like to move blocks around and rename things everywhere, which is
exactly what makes their diffs hard to read. So diffly marks a block that
moved instead of showing it as an unrelated delete and add, and reports a
rename that repeats across the diff as a single find/replace.

Comments and viewed files are saved per diff in `~/.diffly/state.json`, so
quitting and reopening the same diff picks up where you left off.

## Try it without installing

    curl -sL https://raw.githubusercontent.com/Merhii/Diffly/main/fixtures/operations-demo.diff | npx --yes @merhi/diffly

Requires Node 20+. MIT.
