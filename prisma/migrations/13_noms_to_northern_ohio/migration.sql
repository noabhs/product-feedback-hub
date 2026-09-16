-- Move everything filed under NOMS onto Northern Ohio Medical Specialists
-- Healthcare, per Noa's instruction.
--
-- Most of it is already there. "NOMS" is a registered alias of that account, so
-- the original remap resolved "NOMS", "NOMS (Quality team)", "NOMS (DS team)",
-- "NOMS providers (multiple)" and the "NOMS — Dr. Bower" variants long ago —
-- 12 of the 17 rows in the seeded data.
--
-- What's left is "NOMS + Privia providers", 5 rows in the seeded data. Those
-- names two accounts, and matchAccount() refuses to guess between them by
-- design, so they were left as free text: filterable by nothing and counted
-- against no client. Noa's call is that they belong to NOMS.
--
-- The Privia half is not thrown away. The original string moves into clientRaw,
-- which the feedback panel already renders as 'recorded as "..."', so each entry
-- still shows it was a joint NOMS/Privia session and the move stays reversible.
--
-- Word-boundary match rather than LIKE '%noms%', so a client that merely
-- contains those four letters isn't dragged in. Rows already carrying the
-- canonical name are excluded, which also makes this safe to re-run.
UPDATE "Insight"
SET "clientRaw" = COALESCE("clientRaw", "client"),
    "client"    = 'Northern Ohio Medical Specialists Healthcare'
WHERE "client" IS NOT NULL
  AND "client" <> 'Northern Ohio Medical Specialists Healthcare'
  AND "client" ~* '\mnoms\M';
