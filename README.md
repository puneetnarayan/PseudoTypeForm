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

Next.js (App Router) + TypeScript + Tailwind CSS. Data is persisted to a
local JSON file (`data/db.json`, gitignored) via `src/lib/db.ts` — no
external database needed to run the app.

- `src/app/page.tsx` — dashboard listing all forms
- `src/app/builder/[id]` — form editor and response summaries
- `src/app/f/[id]` — the public, conversational form-filling experience
- `src/app/api/forms/**` — REST-ish API routes backing the UI
