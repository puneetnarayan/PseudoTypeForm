# PseudoTypeForm

A Typeform-style app: build conversational, one-question-at-a-time forms and
collect responses.

## Features

- **Builder** — create a form, add/reorder/remove questions (short text, long
  text, email, number, multiple choice, yes/no, rating), mark questions
  required, and pick a theme color.
- **Filler** — a full-screen, one-question-at-a-time experience with a
  progress bar, keyboard navigation (Enter to advance), and auto-advancing
  choice questions, at a shareable `/f/[id]` link.
- **Responses** — per-question summaries (bar breakdowns for choice/rating
  questions, an average for ratings) plus a raw response table.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A sample "Customer
Feedback" form is seeded automatically on first run.

## How it's built

Next.js (App Router) + TypeScript + Tailwind CSS.

- `src/app/page.tsx` — dashboard listing all forms
- `src/app/builder/[id]` — form editor and response summaries
- `src/app/f/[id]` — the public, conversational form-filling experience
- `src/app/api/forms/**` — REST-ish API routes backing the UI

## Data storage

`src/lib/db.ts` picks a backend automatically:

- **Local dev** (no `GITHUB_DATA_TOKEN` set) — a JSON file at `data/db.json`
  on disk (gitignored). Zero setup; this is what `npm run dev` uses.
- **Production on Vercel** — Vercel's serverless functions run on a
  read-only filesystem, so a local file doesn't work there. Instead, when
  `GITHUB_DATA_TOKEN` is set, data is read from and committed to a JSON file
  in a GitHub repo via the GitHub REST API (`src/lib/db-github.ts`). Every
  form save and every full form submission becomes one commit — nothing is
  committed per-question/per-keystroke.

### Setting up the GitHub-backed store

`src/lib/db-github.ts` deliberately only calls the GitHub **Contents API**
(read + create/update one file) and never the Git Data API (blobs/trees/
commits/refs) — fine-grained personal access tokens can't call the latter
(`403 Resource not accessible by personal access token`), only the former.
One consequence: this code can't create the data branch itself, only the
file on top of an already-existing branch.

For `puneetnarayan/PseudoTypeForm`, the `data` branch and its seeded
`db.json` already exist (branched off the empty `main`, so it starts out
isolated from the app's source history). If you point this at a different
repo/branch, create that branch first (e.g. via the GitHub UI's branch
picker, a Claude Code session with GitHub write access, or a classic PAT/
GitHub App token, which can use the Git Data API).

1. Create a GitHub personal access token with write access to wherever the
   data file lives:
   - **Fine-grained token**: scope it to just the target repo, with
     **Contents: Read and write** permission.
   - Classic token: the `repo` scope.
2. In your Vercel project settings, add these environment variables:
   - `GITHUB_DATA_TOKEN` — the token from step 1 (mark it "Sensitive").
   - `GITHUB_DATA_OWNER` / `GITHUB_DATA_REPO` — only if not using
     `puneetnarayan/PseudoTypeForm`.
   - `GITHUB_DATA_BRANCH` — optional, defaults to `data`.
   - `GITHUB_DATA_PATH` — optional, defaults to `db.json`.
3. Redeploy.

If you're keeping the data branch in this same repo and Vercel deploys
previews for every branch, pushes to `data` could trigger extra
deployments. Vercel's **Ignored Build Step** project setting can skip
builds for a specific branch, but I wasn't able to verify the exact
script/exit-code convention for that feature from this environment (its
network proxy blocks reaching Vercel's own docs) — check Vercel's current
docs for the precise syntax before relying on it. Using a separate,
dedicated repo for data sidesteps this entirely.

Known limitations: the GitHub Contents API caps inline file reads at 1MB, so
this won't scale past a modest number of forms/responses, and writes retry
a few times on a stale-SHA conflict but aren't fully safe under heavy
concurrent traffic.
