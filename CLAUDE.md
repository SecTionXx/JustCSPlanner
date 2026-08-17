# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**JustCSPlanner** — a job-management planner for a Freight Forwarder **Customer Service (CS) team**. One **Job Card** per booking/shipment is the unit of work and the single source of truth. The team creates jobs, assigns a primary CS owner (+ optional backup), tracks status/deadline, manages To-dos, and keeps a full activity history. The goal: every booking has a clear owner, no deadline drops, and all data lives in one place.

Original design explored Microsoft Teams + Lists + Power Automate (see `docs/freight-forwarder-line-planner-project-brief.md`, `docs/teams-ai-operations-planner-design.md`, `docs/teams-ai-operations-planner-implementation-guide.md`, and the mockups under `docs/mockups/`). **The active build direction pivots away from that**: Next.js frontend + Google Sheets as the database. Treat the Teams/Power-Automate docs as domain/process reference, not the target architecture.

Planning/design docs and HTML mockups live in `docs/` (mockups in `docs/mockups/`). The canonical data model is `docs/google-sheets-schema.md`.

## Tech stack (target)

- **Frontend / app:** Next.js (App Router). TypeScript, React Server Components by default.
- **Data store:** Google Sheets — one workbook acts as the database, one sheet per entity (see Domain model below). Access via the Google Sheets API (server-side only, in Next.js Route Handlers / Server Actions). Never expose Sheets credentials or call the API from the client.
- **Notifications:** out of scope for the first slice; originally LINE/Teams. Add later behind an abstraction.

## Commands

Standard Next.js commands (App Router, TypeScript, Tailwind v4, shadcn/ui):

```bash
npm run dev        # local dev server (http://localhost:3000)
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint
npm run test       # vitest — run all unit tests once
npm run test:watch # vitest — watch mode
npm run test:coverage  # vitest — run with v8 coverage report
```

Single test invocation (example):

```bash
npx vitest run src/components/shell/__tests__/status-badge.test.tsx
```

Data layer is mock-first behind a repository interface (`src/lib/repository.ts`); the Google Sheets adapter is a later round. If a test runner is added later, document the single-test invocation here.

## Configuration & secrets

Sheets access requires Google service-account credentials. Keep them server-side only:

- `GOOGLE_SHEETS_SPREADSHEET_ID` — the workbook acting as the database.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (or a path to the JSON key).
- All in `.env.local` (gitignored). **Never** commit credentials or read them into client bundles.

## Domain model (the part that matters most)

Three core entities. Field names mirror the design docs and mockups — keep them stable; the Sheets schema and the UI depend on them.

### Job Card (sheet: `JobCards`)
`jobId` (e.g. `JOB-2026-0001`) · `customer` · `bookingNumber` · `shipmentType` (FCL / LCL / Air, or Export Sea / Import Sea / Air Freight) · `route` (e.g. Bangkok → Singapore) · `carrier` (shipping line / airline, when known) · `owner` (primary CS, exactly one) · `backup` (assistant CS) · `status` · `priority` (Normal / High / Critical) · `deadline` · `eta` / `etd` · `latestSummary` · `docLinks`.

### To-do (sheet: `Todos`)
`todoId` · `jobId` (FK → Job Card) · `title` · `assignee` · `status` (Not Started / Doing / Waiting / Done) · `deadline` · `source` (Template / Assigned / AI draft).

### Activity Log (sheet: `ActivityLog`)
`logId` · `jobId` · `actor` · `timestamp` · `event` · `oldValue` · `newValue` · `refLink`. Append-only — every status change, reassignment, and comment writes a row. Ownership hand-offs must record the prior owner + reason + time.

### Status vocabulary (keep canonical)
- Job Card: `New` · `In Progress` · `Waiting Customer` · `Waiting Docs` · `Blocked` · `Needs Help` · `Completed`.
- Closing a Job Card or changing owner/deadline are **high-trust mutations** — always confirm before write (matches the design's "AI proposes, human confirms" rule).

## Architecture notes

- **Server-only data access.** All Google Sheets reads/writes go through Next.js Route Handlers or Server Actions. Expose typed fetch helpers to components; never hand raw Sheets rows to the client.
- **Sheets as DB caveats.** No relational integrity or transactions — enforce `jobId` linkage and append-only activity log in code. Sheet is good for low-volume team use; revisit if row counts or concurrent writers grow.
- **Templates per shipment type.** Opening a Job Card from a template (Export Sea / Import Sea / Air Freight) auto-generates its To-do checklist. See `teams-ai-operations-planner-design.md` §11 for the per-type checklists.
- **Roles & permissions** (apply from the start): ผู้สั่งงาน (requester) · CS owner · CS assistant · หัวหน้าทีม (lead) · ผู้ดูแลระบบ (admin). Dashboard/workload views are primarily for lead + admin.

## Key screens (from mockups — reference for UI)

All mockups are under `docs/mockups/`: `cs-team-dashboard.html` (team dashboard / workload) · `freight-operations-app-screens.html` (app screens) · `freight-operations-power-app-mockup.html` (layout mockup) · `new-job-form-design.html` (create-job form — the canonical "new job" screen). Reuse these as the visual spec when building Next.js routes.

## Conventions

- Thai-first UI copy; identifiers/keys/loggs in English. Job IDs follow `JOB-YYYY-NNNN`.
- Keep the create-job form short (single screen) and notify the assigned CS immediately on save — this is an explicit UX requirement, not a nice-to-have.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
