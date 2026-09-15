@AGENTS.md

# Navina Insights Hub

Internal Navina tool (Next.js 16, App Router) that centralizes product feedback,
discovery questions, competitor intel, and feature requests, and lets the team
ask natural-language questions over all of it ("Ask Q", backed by Claude).
Sign-in is Google OAuth restricted to `@navina.ai`.

Repo name and folder name differ: this folder is `navina-insights-hub`, the
GitHub repo is `noabhs/product-feedback-hub`.

## Shared service, not per-user

This runs against one shared Neon Postgres DB, one shared Google OAuth client,
one shared Slack app, one shared Notion integration token. Don't spin up a
personal Neon project or Google OAuth client to get unblocked locally — that
forks the data and breaks the OAuth redirect URI for everyone else. Get the
real values for `DATABASE_URL`/`NEON_DATABASE_URL`, `NEON_DATABASE_URL_UNPOOLED`,
`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `NOTION_TOKEN`,
`GOOGLE_SERVICE_ACCOUNT_JSON`, `SLACK_SIGNING_SECRET` from a teammate via a
secrets manager. `ANTHROPIC_API_KEY` is the one exception — fine to use your own.
See [SETUP.md](SETUP.md) for the full walkthrough of provisioning each service.

## Data model (prisma/schema.prisma)

- `Insight` — client feedback, tagged with `productAreas` (array — one item can
  span areas) and `theme`. `client`/`clientRaw` split exists because client was
  free text until Aug 2026 and split into near-duplicate names; `Account` is now
  the canonical list with `aliases` for remapping.
- `Account` — canonical client list; also carries a snapshot of Salesforce data
  (ARR, health, CSM, etc.) as of 2026-08-18. Accounts outside that report's
  filter (active direct accounts) keep null Salesforce fields.
- `DiscoveryQuestion`, `SourceDocument` — discovery-prep content, same
  `productArea`/`theme` vocabulary as `Insight`.
- `FeatureRequest` — internally-reported ideas, distinct from `Insight` (client
  feedback). Only the reporter or the hub owner (`src/lib/people.ts`) may edit.
- `Competitor` → `CompetitorSource` (links) → `CompetitorDocument` (fetched text,
  including failed/skipped fetches — coverage is tracked deliberately) →
  `CompetitorInsight` (discrete claims, not prose summaries, so claims can be
  filtered/cited individually and contradictions between sources stay visible).
  Sourced from the "CI Launcher" tool.
- `AskLog` — every Q&A pair through "Ask Q" (web and Slack `/ask`), with rating
  and `promptVersion` so a bad answer traces back to the prompt that produced it.
- `Event` — generic audit/analytics log (page views, `entity.action` names).

Convention used throughout: status/category-like fields (`Account.health`,
`FeatureRequest.status`, `Competitor.category`, `CompetitorInsight.confidence`/
`sensitivity`) are plain strings validated against constants in `src/lib/*.ts`,
not Postgres enums — check the relevant `src/lib/*-status.ts` or
`src/lib/labels.ts` / `src/lib/competitor-categories.ts` for the valid set
before writing a new value.

Authorship is by email string (`createdBy`, `actor`, `reporter`), not a user
table — there's no `User` model. `src/lib/people.ts` defines the hub owner
with elevated permissions.

## Layout

- `src/app/(main)/*` — authenticated pages (analytics, clients, competitors,
  discovery, feature-requests, feedback-insights, home, insights, upload).
- `src/app/api/*` — route handlers, roughly one folder per domain area, plus
  `slack/` (`/ask` slash command) and `cron/`.
- `src/lib/*` — business logic and query helpers, one file per concern
  (filters, search, formatting). `src/lib/claude.ts` wraps the Anthropic SDK.
- `src/lib/ingest/*` — Drive/Notion fetching for competitor documents
  (`drive.ts`, `notion.ts`, `extract.ts`, `run.ts` orchestrates a pass).
- `scripts/` — one-off/backfill scripts (e.g. `ingest-competitors.ts`), run
  with `tsx`, not part of the app runtime.

## Commands

- `npm run dev` — local dev server.
- `npm run build` — `prisma generate && prisma migrate deploy && next build`
  (this is what Vercel runs; migrations apply automatically on deploy).
- `npx prisma migrate dev --name <name>` — create/apply a migration locally.
- `npm run seed` — `tsx prisma/seed.ts`.
