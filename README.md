`# Upwork Proposal Engine

A multi-agent Claude Code workflow that turns a raw Upwork posting into a complete, client-winning proposal package: a polished pitch deck, a client-styled HTML one-pager, a tailored cover letter, and a **real working demo** (with a bespoke design fit for the client's industry, not the portfolio's look) deployed live to the `/work-samples` section of michaelwegter.com.

It runs fully autonomously end to end, then stops once for your review-and-revise pass.

## How to run it

From this folder, in Claude Code:

```
/upwork-proposal
```

Then paste the Upwork posting plus any notes of your own (constraints, the angle you want, budget, anything the client said in messages). The orchestrator does the rest.

You can also point it at a file:

```
/upwork-proposal samples/sample-posting.md
```

## What you get

Every run writes to `upwork-runs/<slug>/`:

```
upwork-runs/<slug>/
  brief.json          structured read of the posting (the contract everything is graded against)
  plan.md             demo concept, prototype-vs-full decision, scope fences, requirement matrix
  research.md         domain + competitor + library research, template pointer
  eval-report.md      scored rubric with the hard gates and the fix list
  run.log             per-phase log for debugging
  proposal/
    deck.pptx         the pitch deck
    one-pager.html    standalone client-styled proposal page
    cover-letter.md   the Upwork message to paste
    media/            screenshots + screen recording of the demo
```

The demo itself is built into `michaelwegter.com/public/demos/<slug>/` and registered in `src/data/workSamples.js`, so pushing `main` deploys it live at `michaelwegter.com/work-samples/<slug>`.

## How it works (one paragraph)

A thin orchestrator (`/upwork-proposal`) dispatches seven specialist subagents in sequence: **intake → planner → researcher → demo-builder → media-capture → proposal-writer → evaluator**. Each subagent runs in its own isolated context, does one heavy job, writes its output to disk, and returns a short summary. The orchestrator passes file paths, never file contents, so context never balloons. The evaluator scores the package against hard gates (every requirement addressed, demo builds, demo URL resolves); on failure the orchestrator re-runs only the failing step, capped at two retries. See `docs/upwork-proposal-workflow.md` in the michaelwegter.com repo for the full design rationale, and `CLAUDE.md` here for the conventions every agent relies on.

## Layout

```
.claude/commands/upwork-proposal.md   orchestrator
.claude/agents/*.md                   the 7 subagents
CLAUDE.md                             conventions cache (read by every agent)
reference/brand-voice.md              Michael's writing voice for the cover letter + deck
reference/work-samples-integration/   one-time files to add the /work-samples section to the site
rubric/proposal-rubric.md             the eval rubric
scripts/                              capture, build, link-check, run-scaffold helpers
samples/sample-posting.md             a golden posting to validate the pipeline
```

## One-time setup

The `/work-samples` section has to exist on the site once. Apply the files in
`reference/work-samples-integration/` per its `INTEGRATION.md`, then commit. After
that, every run just appends a new entry. See that folder for the exact steps.
