-- Fold the duplicate "aicny" account into Alliance for Integrated Care of New York.
--
-- "AICNY" has been a registered alias of that account since the canonical list
-- was seeded. A second account called "aicny" still got created from the Add
-- client form, because that form's duplicate check compared the typed name
-- against account names only and never against their aliases. The same gap
-- would have accepted "TGH", "NOMS" or "DTC" as new accounts; the check is
-- fixed in the same change as this migration.
--
-- Feedback moves first, then the duplicate row goes.

UPDATE "Insight"
SET "clientRaw" = COALESCE("clientRaw", "client"),
    "client"    = 'Alliance for Integrated Care of New York'
WHERE "client" IS NOT NULL
  AND "client" <> 'Alliance for Integrated Care of New York'
  AND "client" ~* '\maicny\M';

-- The one deletion in any of these migrations, and only because this row is a
-- duplicate rather than a client: its feedback has just been moved off it, and
-- "aicny" still resolves to the surviving account through the existing alias,
-- so nothing is lost and no text stops matching. Matched case-insensitively on
-- the exact name so it cannot reach the real account, whose name is longer.
DELETE FROM "Account" WHERE lower("name") = 'aicny';
