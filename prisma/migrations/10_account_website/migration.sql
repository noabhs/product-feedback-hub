-- The client's own website, used only to fetch the brand icon shown next to the
-- name. Nullable with no default: nothing in the Salesforce accounts report
-- carries a website, so every row starts empty and is filled in from the panel.
ALTER TABLE "Account" ADD COLUMN "website" TEXT;
