-- The September accounts report, applied over the August one.
--
-- Source: "Accounts Report for Product Requirements", 2026-09-16, same filter as
-- before (active direct accounts). 76 rows: 73 accounts already in the hub, and
-- 3 new ones.
--
-- Three rules this migration keeps, in order of how much damage breaking them
-- would do:
--
-- 1. Nothing is deleted. Carle Health was in the August report and is absent
--    from this one, and 22 accounts have never been in either. All of them keep
--    their row, so the feedback filed against them keeps resolving.
-- 2. No account is renamed. Insight.client holds the display name, so a rename
--    here would orphan every insight pointing at it. Where Salesforce now writes
--    a longer string -- "JCMG-Jefferson City Medical Group", "Physicians'
--    Primary Care of Southwest Florida, P.L." -- the report row is matched onto
--    the existing shorter display name and only its data is updated.
-- 3. liveDate is never touched. It is hand-entered from the client panel and
--    appears in no report; an UPDATE listing it would silently erase it.

-- AlterTable
-- Which report each row's figures came from. Without it the one account that
-- dropped out of this report would show August figures under a September
-- heading, and "renewal overdue" on month-old data is exactly the kind of wrong
-- that gets believed.
ALTER TABLE "Account" ADD COLUMN     "reportAsOf" TIMESTAMP(3);

-- Everything holding data right now came from the August report.
UPDATE "Account"
SET "reportAsOf" = '2026-08-18'::timestamp
WHERE "health" IS NOT NULL OR "arr" IS NOT NULL OR "renewalDate" IS NOT NULL;

-- The 3 accounts new to this report. ON CONFLICT so re-running is a no-op, and
-- so a name someone had already added by hand in the UI is left alone.
INSERT INTO "Account" ("id", "name", "aliases") VALUES
  ('acct-baptist-health-ar', 'Baptist Health (AR)', '["Baptist Health"]'),
  ('acct-island-doctors', 'Island Doctors', '[]'),
  ('acct-uc-san-diego-health-physicians', 'UC San Diego Health Physicians', '["UC San Diego Health Physician Network","UC San Diego Health"]')
ON CONFLICT ("name") DO NOTHING;

-- Now the figures, for all 76 rows in the report.
UPDATE "Account" a SET
  "health"         = v.health,
  "products"       = v.products,
  "ehr"            = v.ehr,
  "segment"        = v.segment,
  "billingState"   = v.billing_state,
  "accountOwner"   = v.account_owner,
  "csmName"        = v.csm_name,
  "hieMembers"     = v.hie_members::int,
  "qualityMembers" = v.quality_members::int,
  "riskMembers"    = v.risk_members::int,
  "arr"            = v.arr::int,
  "carr"           = v.carr::int,
  "renewalDate"    = v.renewal_date::timestamp,
  "lastActivityAt" = v.last_activity::timestamp,
  "firstClosedWon" = v.first_closed_won::timestamp,
  "reportAsOf"     = '2026-09-16'::timestamp
FROM (VALUES
  ('Aegis Medical Group', 'Green', '["Risk","Quality","HIE"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Jordan Arthur', 'Jordan Arthur', 23000, 23000, 23000, 323400, 323400, '2028-03-27', '2026-09-15', '2025-03-28'),
  ('agilon health', 'Green', '["Risk","Quality","HIE"]', 'eClinicalWorks', 'ACO/MSO', 'Ohio', 'Tammy Smith', 'Tammy Smith', 85000, 14000, 85000, 1766760, 2180480, '2027-04-30', '2026-09-15', '2023-12-24'),
  ('Alliance for Integrated Care of New York', 'Yellow', '["Risk","Quality","HIE"]', 'Multiple EMRs', 'ACO/MSO', 'New York', 'Jordan Arthur', 'Jordan Arthur', 7250, 7250, 7250, 246300, 246300, '2027-07-31', '2026-09-15', '2024-07-31'),
  ('ArchesMed', 'Yellow', '["Risk","Quality"]', 'athenahealth', 'ACO/MSO', 'Rhode Island', 'Jordan Arthur', 'Jordan Arthur', 0, 13300, 6300, 226488, 226488, '2027-03-30', '2026-09-22', '2026-02-26'),
  ('Atlas Oncology Partners', 'Green', '["Risk","HIE","Clinician Copilot"]', 'athenahealth', 'Physician Group', 'Tennessee', 'Zeshan Nawaz', NULL, 1189, 0, 1000, 33174, 33174, '2027-08-01', '2026-09-15', '2026-06-17'),
  ('Baptist Health (AR)', 'Yellow', '[]', 'Epic', 'Health System', 'Arkansas', 'Steve Simpson', 'Elle Phillps', 0, 0, 0, 0, 669000, '2027-12-31', '2026-09-24', '2026-08-20'),
  ('Bookmark Medical', 'Green', '["Risk","Quality","HIE"]', 'Multiple EMRs', 'ACO/MSO', 'Tennessee', 'Megan Taylor', 'Megan Taylor', 10000, 156000, 156000, 2373000, 3037200, '2027-05-14', '2026-09-24', '2024-05-14'),
  ('Carolina Pines Regional Medical Center', 'Red', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'South Carolina', 'Zeshan Nawaz', NULL, 12118, 24236, 12118, 190699, 190699, '2026-12-28', '2026-09-10', '2023-12-28'),
  ('Center for Primary Care', 'Green', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Georgia', 'Zeshan Nawaz', 'Zeshan Nawaz', 24000, 12000, 12000, 302400, 302400, '2027-04-30', '2026-09-15', '2024-09-30'),
  ('Christie Clinic', 'Red', '["Risk","Quality","HIE"]', 'Epic', 'Physician Group', 'Illinois', 'Zachary Fritzhand', 'Zachary Fritzhand', 33000, 33000, 33000, 300300, 300300, '2027-12-24', '2026-09-15', '2024-12-23'),
  ('Citadel', 'Yellow', '["Risk","Quality"]', 'eClinicalWorks', 'Health System', 'Georgia', 'Zachary Fritzhand', 'Zachary Fritzhand', 0, 19042, 19042, 432604, 432604, '2027-02-01', '2026-09-10', '2023-11-30'),
  ('ClareMedica Health Partners', 'Yellow', '["Risk","HIE"]', 'eClinicalWorks', 'ACO/MSO', 'Florida', 'Jordan Arthur', 'Jordan Arthur', 500, 0, 27000, 406140, 406140, '2029-03-09', '2026-09-16', '2026-01-28'),
  ('ConvenientMD', 'Green', '["Risk","HIE"]', 'athenahealth', 'Physician Group', 'New Hampshire', 'Zachary Fritzhand', 'Zachary Fritzhand', 400, 0, 6880, 94769, 99936, '2029-02-06', '2026-09-10', '2026-02-05'),
  ('CVFP Medical Group', 'Green', '["Risk"]', 'athenahealth', 'Physician Group', 'Virginia', 'Megan Taylor', 'Megan Taylor', 0, 0, 0, 115200, 115200, '2028-03-06', '2026-09-10', '2023-03-06'),
  ('Doctors Health of South Florida', 'Red', '[]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Zeshan Nawaz', NULL, 0, 0, 0, 0, 0, '2026-05-01', '2026-09-10', '2022-06-10'),
  ('Edinger Medical Group', 'Yellow', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'California', 'Zeshan Nawaz', 'Zeshan Nawaz', 0, 0, 3000, 45000, 45000, '2026-11-20', '2026-09-15', '2023-11-20'),
  ('Evergreen Nephrology', 'Red', '["Risk","Quality","HIE"]', 'Multiple EMRs', 'ACO/MSO', 'Tennessee', 'Jacob Palmer', NULL, 13000, 13000, 13000, 218400, 218400, '2027-10-13', '2026-09-13', '2024-10-13'),
  ('First Medical Associates', 'Green', '["Risk","HIE"]', 'athenahealth', 'Physician Group', 'Maryland', 'Zeshan Nawaz', 'Zeshan Nawaz', 22085, 0, 0, 181455, 181455, '2027-07-01', '2026-09-15', '2023-06-30'),
  ('First Valley Medical Group', 'Red', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'California', 'Ana Mesa', 'Ana Maria Mesa', 1200, 1200, 1200, 70800, 70800, '2027-04-02', '2026-09-15', '2024-04-02'),
  ('Gather Health', 'Green', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'California', 'Zachary Fritzhand', 'Zachary Fritzhand', 4500, 4500, 4500, 174600, 174600, '2027-07-31', '2026-09-11', '2024-07-30'),
  ('Genuine Health Group', 'Red', '["Risk","Quality","HIE"]', 'Multiple EMRs', 'ACO/MSO', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 5000, 5000, 5000, 120000, 120000, '2028-09-01', '2026-09-14', '2024-12-18'),
  ('Glacier Medical Associates', 'Red', '["Risk","Quality","HIE"]', 'eClinicalWorks', 'Physician Group', 'Montana', 'Jordan Arthur', 'Jordan Arthur', 1674, 1674, 1674, 43665, 43665, '2027-06-01', '2026-09-17', '2026-04-19'),
  ('Granger Medical Clinic', 'Red', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Utah', 'Jacob Palmer', NULL, 0, 0, 0, 33600, 33600, '2026-11-28', '2026-07-16', '2023-11-29'),
  ('Greater Good Health', 'Yellow', '[]', 'athenahealth', 'Physician Group', 'California', 'Paige Rasch', 'Zeshan Nawaz', 0, 0, 0, 0, 170818, '2027-10-15', '2026-09-11', '2026-08-05'),
  ('HarmonyCares', 'Green', '["Risk","Quality"]', 'athenahealth', 'Physician Group', 'Michigan', 'Scott Roeber', 'Scott Roeber', 0, 44000, 44000, 660000, 660000, '2028-04-30', '2026-09-15', '2024-12-31'),
  ('HealthStar Physicians', 'Red', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Tennessee', 'Jordan Arthur', 'Jordan Arthur', 17000, 17000, 17000, 374100, 374100, '2028-09-08', '2026-09-10', '2025-09-04'),
  ('HealthTexas Medical Group', 'Green', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Texas', 'Zeshan Nawaz', NULL, 0, 0, 20303, 187672, 187672, '2027-06-01', '2026-09-14', '2024-03-01'),
  ('Herself Health', 'Yellow', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Minnesota', 'Jordan Arthur', 'Jordan Arthur', 5500, 5300, 5300, 128400, 128400, '2027-12-17', '2026-09-15', '2024-12-17'),
  ('Holzer Health System', 'Yellow', '["Risk"]', 'athenahealth', 'Health System', 'Ohio', 'Zachary Fritzhand', 'Zachary Fritzhand', 0, 0, 0, 144000, 144000, '2026-10-30', '2026-09-15', '2024-10-31'),
  ('Hopscotch Primary Care', 'Green', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Illinois', 'Zachary Fritzhand', 'Zachary Fritzhand', 11700, 11700, 11700, 209346, 209346, '2029-02-01', '2026-09-15', '2025-06-04'),
  ('Hudson Headwaters Health Network', 'Red', '["Risk"]', 'athenahealth', 'Physician Group', 'New York', 'Zeshan Nawaz', NULL, 0, 0, 0, 113400, 113400, '2026-11-14', '2026-10-01', '2022-06-15'),
  ('Ilumed', 'Yellow', '["Risk","HIE"]', 'Multiple EMRs', 'ACO/MSO', 'Florida', 'Jordan Arthur', 'Jordan Arthur', 2883, 0, 4689, 88716, 88716, '2026-10-30', '2026-09-15', '2024-10-30'),
  ('IMA of South Florida', 'Red', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 4206, 1957, 4206, 95210, 95210, '2026-09-27', '2026-09-02', '2025-09-03'),
  ('Innovacare Health', 'Green', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Florida', 'Kristin Latter', 'Kristin Latter', 5000, 49100, 54100, 635480, 1354205, '2028-10-01', '2026-09-15', '2023-10-18'),
  ('Internal Medicine Associates & Specialties', 'Yellow', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 0, 0, 1000, 21000, 21000, '2026-10-29', '2026-08-31', '2024-10-29'),
  ('Island Doctors', 'Yellow', '[]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Michael McDonnell', 'Tianca Ashford', 0, 0, 0, 0, 407880, '2027-10-17', '2026-09-15', '2026-08-24'),
  ('Jefferson City Medical Group', 'Yellow', '["Risk","Quality"]', 'eClinicalWorks', 'Physician Group', 'Missouri', 'Jacob Palmer', NULL, 0, 32000, 32000, 352800, 352800, '2029-01-01', '2026-09-30', '2023-06-27'),
  ('Kaiser Foundation Health Plan of the Mid-Atlantic States', 'Red', '["Risk","HIE"]', 'Epic', 'Health Plan', 'District of Columbia', 'Michelle Eberle', 'Michelle Eberle', 111008, 0, 1173759, 6589171, 6778241, '2027-06-30', '2026-09-15', '2026-02-04'),
  ('Lifespark', 'Green', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Minnesota', 'Jordan Arthur', NULL, 3000, 3000, 3000, 90000, 90000, '2027-08-30', '2026-09-10', '2024-07-26'),
  ('Loudoun Medical Group', 'Yellow', '["Risk","Quality"]', 'eClinicalWorks', 'Physician Group', 'Virginia', 'Zachary Fritzhand', 'Zachary Fritzhand', 0, 14733, 14733, 274730, 274730, '2029-01-30', '2026-09-16', '2026-01-07'),
  ('Matter Health', 'Red', '["Risk"]', 'athenahealth', 'Physician Group', 'Tennessee', 'Jordan Arthur', 'Jordan Arthur', 0, 0, 0, 39600, 39600, '2027-01-01', '2026-09-14', '2022-06-10'),
  ('Medical Consultants of Florida', 'Red', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 0, 0, 0, 76800, 76800, '2026-12-31', '2026-09-10', '2021-07-26'),
  ('MediSys Health Network', 'Yellow', '["Risk","Quality","HIE"]', 'Epic', 'Health System', 'New York', 'Elle Phillps', 'Elle Phillps', 38000, 38000, 11400, 577680, 577680, '2028-07-31', '2026-09-15', '2025-08-01'),
  ('MFM Health', 'Yellow', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Massachusetts', 'Zachary Fritzhand', 'Zachary Fritzhand', 12000, 12000, 12000, 257400, 257400, '2028-10-28', '2026-09-15', '2025-09-11'),
  ('Millennium Physician Group', 'Green', '[]', 'athenahealth', 'Physician Group', 'Florida', 'Kristin Latter', 'Kristin Latter', 0, 0, 0, 0, 0, '2030-02-07', '2026-09-16', '2021-12-14'),
  ('Mirra Health Services', 'Yellow', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 0, 0, 9688, 104928, 104928, '2026-12-11', '2026-09-10', '2023-12-11'),
  ('Mountain Laurel Medical Center', 'Green', '["Risk","Quality"]', 'athenahealth', 'Physician Group', 'Maryland', 'Zachary Fritzhand', 'Zachary Fritzhand', 0, 0, 0, 162000, 162000, '2026-12-03', '2026-09-15', '2024-12-03'),
  ('NeueHealth MSO', 'Yellow', '[]', 'eClinicalWorks', 'ACO/MSO', 'Florida', 'Paige Rasch', NULL, 0, 0, 0, 0, 297000, '2027-09-30', '2026-09-16', '2026-07-30'),
  ('Ogden Clinic', 'Green', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Utah', 'Zachary Fritzhand', 'Zachary Fritzhand', 0, 0, 0, 179763, 179763, '2028-01-01', '2026-09-15', '2023-04-04'),
  ('Olmsted Medical Center Physicians', 'Red', '["Risk"]', 'Epic', 'Health System', 'Minnesota', 'Zachary Fritzhand', 'Zachary Fritzhand', 0, 0, 13000, 162000, 162000, '2028-08-30', '2026-09-14', '2024-08-30'),
  ('On Belay Health Solutions', 'Red', '["Risk","Quality","HIE"]', 'Multiple EMRs', 'ACO/MSO', 'Massachusetts', 'Zachary Fritzhand', 'Zachary Fritzhand', 5000, 0, 31347, 580813, 580813, '2028-08-04', '2026-09-15', '2025-05-19'),
  ('OnPoint Medical Group', 'Green', '["Risk"]', 'athenahealth', 'Physician Group', 'Colorado', 'Jordan Arthur', 'Jordan Arthur', 0, 0, 0, 183960, 183960, '2026-12-12', '2026-09-15', '2020-07-30'),
  ('Osvaldo A Torres MD', 'Yellow', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 0, 0, 1521, 21464, 21464, '2026-12-09', '2026-09-10', '2023-12-09'),
  ('Palm Medical Centers', 'Yellow', '["Risk","Quality"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Steve Simpson', 'Ana Maria Mesa', 0, 25732, 25732, 491303, 491303, '2027-07-31', '2026-09-14', '2026-05-28'),
  ('Physicians Primary Care', 'Green', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 0, 0, 36000, 111648, 111648, '2026-12-04', '2026-09-11', '2023-08-29'),
  ('Primary Medical Care Center and Urgent Care Clinic', 'Red', '["Risk","Quality"]', 'eClinicalWorks', 'Physician Group', 'Florida', 'Ana Mesa', 'Jordan Arthur', 0, 2300, 2300, 55200, 55200, '2027-02-01', '2026-09-10', '2025-01-31'),
  ('Primus Health Network', 'Green', '["Risk","HIE"]', 'eClinicalWorks', 'ACO/MSO', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 6996, 0, 9043, 162318, 162318, '2027-07-25', '2026-09-15', '2023-07-25'),
  ('Privia Health', 'Yellow', '["Risk"]', 'athenahealth', 'ACO/MSO', 'Virginia', 'Megan Taylor', 'Megan Taylor', 0, 0, 0, 2961000, 2961000, '2028-10-01', '2026-09-16', '2023-07-26'),
  ('SC House Calls', 'Red', '["Risk","Quality"]', 'athenahealth', 'Physician Group', 'South Carolina', 'Connie Minerich', NULL, 0, 0, 0, 840000, 840000, '2026-09-15', '2026-09-10', '2022-02-08'),
  ('SFP Health Group', 'Yellow', '["Risk","HIE"]', 'athenahealth', 'Physician Group', 'Florida', 'Zeshan Nawaz', NULL, 2400, 0, 2400, 51811, 51811, '2026-10-17', '2026-09-23', '2024-10-18'),
  ('Southeast Primary Care Partners', 'Red', '["Risk","Quality"]', 'Veradigm', 'ACO/MSO', 'Georgia', 'Jordan Arthur', 'Jordan Arthur', 0, 40000, 40000, 360000, 360000, '2027-08-16', '2026-09-10', '2023-09-15'),
  ('Sprinter Health', 'Red', '["Risk","HIE"]', 'Elation Health', 'Physician Group', 'California', 'Jacob Palmer', NULL, 0, 0, 0, 80000, 80000, '2027-03-18', '2026-08-25', '2025-03-18'),
  ('Summit Medical Group', 'Red', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Tennessee', 'Tammy Smith', 'Tammy Smith', 100364, 100364, 100364, 1806552, 1806552, '2027-06-27', '2026-09-15', '2024-12-20'),
  ('TECQ Partners', 'Red', '["Risk","Quality","HIE"]', 'Multiple EMRs', 'ACO/MSO', 'Texas', 'Jacob Palmer', NULL, 5900, 5900, 5900, 164580, 164580, '2027-04-19', '2026-09-10', '2025-04-18'),
  ('The Harbor Health Team', 'Red', '["Risk","Quality","HIE","Clinician Copilot"]', 'athenahealth', 'Physician Group', 'Texas', 'Zeshan Nawaz', NULL, 23000, 33000, 23000, 669600, 669600, '2029-03-30', '2026-09-15', '2025-12-22'),
  ('TriValley Medical Group', 'Green', '["Risk","Quality"]', 'athenahealth', 'Physician Group', 'California', 'Zeshan Nawaz', 'Zeshan Nawaz', 0, 4000, 4000, 75000, 75000, '2026-10-31', '2026-09-10', '2023-10-31'),
  ('TriValley Primary Care', 'Green', '["Risk"]', 'eClinicalWorks', 'Physician Group', 'Pennsylvania', 'Zachary Fritzhand', 'Zachary Fritzhand', 0, 0, 0, 168000, 168000, '2027-03-29', '2026-09-15', '2022-12-21'),
  ('Tryon Medical Partners', 'Red', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'North Carolina', 'Zeshan Nawaz', 'Zeshan Nawaz', 23877, 7627, 16250, 437576, 437576, '2026-12-22', '2026-09-14', '2025-12-18'),
  ('Tufts Medicine', 'Yellow', '["Risk","Quality","HIE"]', 'Multiple EMRs', 'Health System', 'Massachusetts', 'Zachary Fritzhand', 'Zachary Fritzhand', 2614, 2614, 2614, 65678, 65678, '2029-06-08', '2026-09-16', '2026-06-04'),
  ('U.S. Renal Care', 'Green', '["Risk","HIE"]', 'athenahealth', 'ACO/MSO', 'Texas', 'Zeshan Nawaz', NULL, 15000, 0, 15000, 260400, 260400, '2026-12-24', '2026-09-15', '2024-12-24'),
  ('UC San Diego Health Physicians', 'Yellow', '["Risk"]', 'Epic', 'Health System', 'California', 'Christina Blake', NULL, 0, 0, 6333, 81396, 81396, '2029-09-10', '2026-09-01', '2026-09-04'),
  ('UniMed HealthCare', 'Green', '["Risk","Quality"]', 'athenahealth', 'Physician Group', 'Florida', 'Ana Mesa', 'Ana Maria Mesa', 0, 950, 950, 27600, 27600, '2027-06-17', '2026-09-29', '2025-06-16'),
  ('Upperline Health', 'Yellow', '["Risk"]', 'athenahealth', 'ACO/MSO', 'Tennessee', 'Elle Phillps', 'Elle Phillps', 0, 0, 52000, 511680, 511680, '2027-10-01', '2026-09-15', '2023-08-16'),
  ('Upward Health', 'Green', '["Risk","Quality","HIE"]', 'athenahealth', 'Physician Group', 'Delaware', 'Jordan Arthur', 'Jordan Arthur', 4000, 4000, 4000, 109553, 109553, '2028-06-25', '2026-09-10', '2025-04-25'),
  ('Valora Medical Group', 'Green', '["Risk","Quality","HIE"]', 'eClinicalWorks', 'Physician Group', 'Texas', 'Zeshan Nawaz', NULL, 6000, 6000, 6000, 100800, 100800, '2027-08-16', '2026-09-14', '2023-08-16'),
  ('VillageMD', 'Green', '["Risk","Quality","HIE"]', 'athenahealth', 'ACO/MSO', 'Oregon', 'Scott Roeber', 'Michelle Eberle', 50746, 50746, 50746, 815995, 815995, '2028-11-30', '2026-09-11', '2025-10-21')
) AS v(
  name, health, products, ehr, segment, billing_state, account_owner, csm_name,
  hie_members, quality_members, risk_members, arr, carr,
  renewal_date, last_activity, first_closed_won
)
WHERE a."name" = v.name;
