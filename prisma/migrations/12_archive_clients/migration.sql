-- Archiving for clients that aren't real accounts any more.
--
-- Twelve of the ninety-nine have never appeared in any accounts report, and Noa
-- reviewed the list and marked these for archiving. They are not deleted: each
-- keeps its row, its aliases and every insight filed against it. What archiving
-- changes is that they leave the main client table and the feedback picker, so
-- nothing new can be filed against them.
--
-- Deliberately NOT changed: the six accounts Noa marked "do nothing" (Advisors,
-- which is the internal advisory panel rather than a client, the five
-- Kaiser/Permanente regional groups, and Rancho Family Medical Group), the three
-- marked for merging, which need a target before anything can move, and Carle
-- Health, which has real figures from August.

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- Matched by exact display name. An account missing from this list stays active,
-- which is the safe direction to fail.
UPDATE "Account"
SET "archivedAt" = '2026-09-16'::timestamp
WHERE "name" IN (
  'Adventist Healthcare',
  'Amite County Medical Services',
  'Cano Health',
  'Cardiovascular Associates of America',
  'Catalyst Health Group',
  'Family Practice of Cadillac',
  'IntraCare Premier ACO',
  'MedNetOne Health Solutions',
  'North East Medical Services',
  'PrimeHealth Physicians',
  'Tampa General Hospital',
  'Vanguard Medical Group'
);
