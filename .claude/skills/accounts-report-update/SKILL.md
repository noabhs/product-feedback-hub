---
name: accounts-report-update
description: Apply a new Salesforce "Accounts Report for Product Requirements" .xlsx to the Insights Hub client list — update existing accounts, add new ones, keep accounts the report has dropped, and never break the feedback attached to them. Use whenever Noa drops a new accounts report and asks to update the hub, the clients page, or the client data; when asked to refresh health / ARR / renewal / EHR / segment / products from Salesforce; or when a file matching "Accounts Report for Product Requirements-<date>.xlsx" appears. Also covers archiving a client, un-archiving one that reappears, and merging one client's feedback into another.
---

# Updating the client list from an accounts report

Ariel Tzur exports this report from Salesforce every few weeks, filtered to
active direct accounts, and Noa drops the `.xlsx` into the chat. Each run is the
same shape: refresh the accounts the report covers, add the ones it introduces,
and leave everything else alone.

Noa is a PM and does not run commands. Everything here is yours to do in the
repo; what she needs back is a short summary of what moved and anything worth a
question to Ariel.

## The four rules

Breaking any of these loses data or silently misattributes feedback. In order of
how much damage they do:

1. **Never delete an account.** A report is a snapshot of *active direct*
   accounts. An account missing from it may have churned, gone indirect, or
   changed status — and its feedback is still real. It keeps its row.
2. **Never rename an account.** `Insight.client` stores the *display name*, not a
   foreign key. Renaming orphans every insight pointing at it. When Salesforce
   writes a longer or different string, match it onto the existing display name
   and update only the figures.
3. **Never write `liveDate` or `archivedAt` from a report.** `liveDate` is typed
   in by hand from the client panel; `archivedAt` is a decision Noa made. Neither
   appears in any report, and including them in an `UPDATE` erases them.
4. **Never guess a merge target.** Merging rewrites `Insight.client`. If a report
   row can't be matched confidently, ask — don't pick the closest name.

## Running it

From the repo root, with the `.xlsx` path and today's date:

```bash
SP=<scratchpad>
S=.claude/skills/accounts-report-update/scripts
python3 $S/read_report.py "<report.xlsx>" $SP/report.json
python3 $S/plan_update.py . $SP/report.json $SP/plan.json
```

`plan_update.py` prints matched / new / dropped and flags two things that stop
the run: two report rows landing on one account, and an **archived** account
reappearing in the report. Both are questions for Noa.

Then write `$SP/decisions.json` naming each new account (see below) and generate:

```bash
python3 $S/generate_migration.py $SP/report.json $SP/plan.json $SP/decisions.json \
    <YYYY-MM-DD> prisma/migrations/<N>_accounts_<month>
```

The generator refuses to invent a display name, and emits no `DELETE`, no
`DROP`, no rename, and no write to `liveDate` or `archivedAt`.

### Naming a new account

`decisions.json` looks like:

```json
{"new_accounts": {
  "Derry Medical Center (AKA DMC Primary Care)": {
    "name": "Derry Medical Center", "aliases": ["DMC Primary Care"]
  }
}}
```

The conventions, which exist because free-text clients used to fragment into
three spellings each:

- **Clean the display name.** `Bookmark Medical`, not
  `Bookmark Medical (FKA Rural Healthcare Group)`.
- **FKA / AKA / "formerly" text becomes an alias**, never part of the name. That
  is what keeps feedback filed under `CareMax`, `Wellforce`, `NOMS` or `TGH`
  resolving.
- **Keep a real disambiguator.** `Baptist Health (AR)` keeps its `(AR)` — it's
  Arkansas, not a former name, and `Baptist Health` alone would invite a
  collision. Add the bare form as an alias.
- **Don't invent acronyms.** Only aliases the report actually gives you.

## Then update the code

- `src/lib/accounts.ts` — set `REPORT_AS_OF` to the report date, and add each new
  account to `SEED_ACCOUNTS` with the same name and aliases as the migration.
- `PRODUCTS` is an *ordering*, not the filter's option list. Leave values in it
  when they vanish from a report; "Reporting API" disappeared in September and
  came back in October.
- Nothing else should need touching. `reportAsOf`, the archive tab and the
  renewal flag all derive from the data.

## Verify

There is no local database and the app is behind Google sign-in, so the
migration cannot be executed and the page cannot be opened. What you *can* do,
and should:

1. `npx tsc --noEmit`, `npx eslint src/`, `npx next build`.
2. **Validate the SQL structurally** — every `VALUES` row the same arity as the
   alias list, balanced quotes, no duplicate target names, every `UPDATE` target
   resolving to a seeded or newly inserted account, and no `DELETE`/`DROP`.
3. **Replay the migrations into a fixture** and run the real helpers over it:
   build each account by layering every `reportAsOf`-stamped migration in order,
   then check `atRenewalRisk`, `reportIsStale`, `matchesAccountFilters` and
   `accountTableRow`. The invariants that must always hold: a Green account is
   never flagged at renewal risk, an account with no renewal date is never
   flagged, an account no report ever covered never reports as stale, an archived
   account never appears in the active tab, and every table row is the full
   column width.

## What to tell Noa

Lead with what moved, not with what you did:

- New accounts, and accounts the report has dropped (these become *stale* — they
  keep their old figures and the row says "as of <date>").
- How many accounts changed health, ARR, products, CSM. **Watch the health
  spread.** In August 54 of 74 were Red; in September 24 of 76. That scale of
  movement means the field started being maintained, not that 43 accounts
  turned — say so rather than letting it read as a trend.
- The renewal-at-risk list, since it is the page's actionable output.
- Anything that looks like a data problem rather than a change: an account with
  an overdue renewal and £0 ARR, or one that has dropped out of the report while
  still flagged at risk on stale figures. Those are churn, not risk.

## Related jobs

**Archiving a client** needs no migration — the client panel has Archive and
Restore, and Noa can do it herself. Only reach for SQL for a batch, as
`12_archive_clients` did. Archived clients keep their row and their feedback and
leave the main table and the feedback picker; their names still *resolve*, so a
CSV import naming one still lands on the right row.

**An archived account reappearing in a report** is deliberately not automatic.
Ask Noa whether to restore it.

**Merging one client into another** rewrites `Insight.client`, so it needs a
target from Noa and nothing less. Preserve the original string in `clientRaw`
(`COALESCE("clientRaw", "client")`) — the feedback panel renders it as
*recorded as "..."*, which keeps the move traceable and reversible. Match on a
word boundary (`~* '\mnoms\M'`), never `LIKE '%...%'`. Note that most aliases
already resolve, so check what is genuinely stranded before writing anything:
of 17 rows mentioning NOMS, 12 had already resolved and only the 5 joint
"NOMS + Privia providers" rows needed moving. Leave `matchAccount`'s
two-account-means-null rule alone; one pair's worth of judgement is not grounds
to make every ambiguous pair pick a side.

## Gotchas that have already cost time

- **The export layout changes.** August and September had three preamble rows
  with Account Name first; October had no preamble and Account Name last. Read
  columns by header name. Headers have also carried trailing sort arrows
  (`Account Name  ↑`), and there is a `Total` summary row to drop.
- **The hub is not the report.** Accounts also arrive through the UI, so the
  migration's roster is unknowable from the repo. Always `ON CONFLICT DO NOTHING`.
- **`'NULL'` is a string.** When diffing an old migration's SQL against fresh
  report records, an unset cell is the literal text `NULL` on one side and `''`
  on the other. Comparing them naively reported 20 CSM changes where there
  were 3.
- **`Advisors` is not a client.** It's the internal advisory panel, it has no
  health by design, and `matchAccount` sends anything mentioning "advisor" to it.
  Never archive or merge it as dead data.
- **Count the roster from the migrations, not from a regex over `accounts.ts`.**
  `SEED_ACCOUNTS` writes `{ name: ADVISORS }` as a constant, so a regex for
  string literals silently misses it — which is how the list got reported as 95
  accounts when it was 96.
