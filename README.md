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

1. Create a GitHub personal access token with write access to wherever the
   data file should live:
   - **Fine-grained token** (recommended): scope it to just the target repo,
     with **Contents: Read and write** permission.
   - Classic token: the `repo` scope.
2. Decide where the data file lives — **pick one**:
   - **A separate, dedicated repo** (recommended) — e.g. create an empty
     `PseudoTypeForm-data` repo. This guarantees a form submission can never
     accidentally trigger a Vercel deployment, since Vercel isn't watching
     that repo at all. Set `GITHUB_DATA_OWNER` / `GITHUB_DATA_REPO` in Vercel
     to point at it.
   - **This same repo, on a separate `data` branch** (the default if you
     don't set `GITHUB_DATA_OWNER`/`GITHUB_DATA_REPO`) — simpler to set up,
     but if Vercel is configured to deploy previews for every branch, pushes
     to `data` could trigger extra deployments. If you go this route, use
     Vercel's **Ignored Build Step** project setting to skip builds for the
     `data` branch — I wasn't able to verify the exact script/exit-code
     convention for that feature from this environment, so check Vercel's
     current docs for the precise syntax before relying on it.
3. In your Vercel project settings, add these environment variables:
   - `GITHUB_DATA_TOKEN` — the token from step 1 (mark it "Sensitive").
   - `GITHUB_DATA_OWNER` / `GITHUB_DATA_REPO` — only if using a separate repo
     (owner and repo name).
   - `GITHUB_DATA_BRANCH` — optional, defaults to `data`.
   - `GITHUB_DATA_PATH` — optional, defaults to `db.json`.
4. Redeploy. The first read/write auto-creates the branch and seeds it with
   the sample "Customer Feedback" form.

Known limitations: the GitHub Contents API caps inline file reads at 1MB, so
this won't scale past a modest number of forms/responses; writes retry a few
times on a stale-SHA conflict but aren't fully safe under heavy concurrent
traffic; and I verified the read/auth path against the live GitHub API but
could not exercise the branch-creation/write path from within this session
(its outbound network proxy blocks write calls to external APIs) — worth a
quick smoke test (submit one response, check the repo for a new commit)
after your first deploy.
