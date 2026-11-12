-- Product areas and who owns them, from the "Product areas" tab of the Product & R&D Map sheet
-- (snapshot 2026-11-12). Additive only: two new tables, no existing table touched.

-- CreateTable
CREATE TABLE "ProductArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "covers" TEXT,
    "teams" TEXT[],
    "notes" TEXT,
    "hubAreas" TEXT[],
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAreaOwner" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "scope" TEXT,

    CONSTRAINT "ProductAreaOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductArea_name_key" ON "ProductArea"("name");

-- CreateIndex
CREATE INDEX "ProductAreaOwner_areaId_idx" ON "ProductAreaOwner"("areaId");

-- CreateIndex
CREATE INDEX "ProductAreaOwner_email_idx" ON "ProductAreaOwner"("email");

-- AddForeignKey
ALTER TABLE "ProductAreaOwner" ADD CONSTRAINT "ProductAreaOwner_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "ProductArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('ambient','Ambient',NULL,ARRAY[]::TEXT[],'Not on the map yet (from the Notion mapping)',ARRAY['AMBIENT']::TEXT[],0);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('ambient:pm:chen-arbel','ambient','pm','Chen Arbel','chen.arbel@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('ambient:pm_manager:adi-gilad','ambient','pm_manager','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('mobile-app','Mobile app',NULL,ARRAY[]::TEXT[],'Not on the map yet (from the Notion mapping)',ARRAY[]::TEXT[],1);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('mobile-app:pm:chen-arbel','mobile-app','pm','Chen Arbel','chen.arbel@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('mobile-app:pm_manager:adi-gilad','mobile-app','pm_manager','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('point-of-care','Point of Care (provider app)','All provider app capabilities incl. Dx insights (provider feedback, auto doc, UX/UI), documents and the clinical summary tabs',ARRAY['POC Applications','HB POC']::TEXT[],'Teams tab: Chen Arbel is DX product here and Alma Peri provider app',ARRAY['POINT_OF_CARE']::TEXT[],2);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('point-of-care:pm:alma-peri','point-of-care','pm','Alma Peri','alma.peri@navina.ai','provider app');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('point-of-care:pm:chen-arbel','point-of-care','pm','Chen Arbel','chen.arbel@navina.ai','DX product');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('point-of-care:pm_manager:adi-gilad','point-of-care','pm_manager','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('point-of-care:medical_manager:alma-peri','point-of-care','medical_manager','Alma Peri','alma.peri@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('point-of-care:medical_lead:moti-arzuan','point-of-care','medical_lead','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('point-of-care:sponsor:adi-gilad','point-of-care','sponsor','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('point-of-care:sponsor:moti-arzuan','point-of-care','sponsor','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('risk-adjustment-product','Risk adjustment (RA) product','Dx engine, coder app, Dx suggestion workflow and behavior, RA workflow (VBC / commercial patients, specialties, HCC gaps files, RCM)',ARRAY['RA Engine','HB POC']::TEXT[],'Inbal Dekel owns the risk adjustment logic (medical, per Notion). Alma Peri is on RA Engine per the Teams tab (Notion: provider app only)',ARRAY['RISK_DX','CODERS']::TEXT[],3);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:pm:chen-arbel','risk-adjustment-product','pm','Chen Arbel','chen.arbel@navina.ai','DX product');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:pm:alma-peri','risk-adjustment-product','pm','Alma Peri','alma.peri@navina.ai','provider app');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:pm_manager:adi-gilad','risk-adjustment-product','pm_manager','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:medical_manager:emanuel-melaku','risk-adjustment-product','medical_manager','Emanuel Melaku','emanuel.melaku@navina.ai','DX medical');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:medical_manager:alma-peri','risk-adjustment-product','medical_manager','Alma Peri','alma.peri@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:medical_lead:moti-arzuan','risk-adjustment-product','medical_lead','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:sponsor:adi-gilad','risk-adjustment-product','sponsor','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-product:sponsor:moti-arzuan','risk-adjustment-product','sponsor','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('quality','Quality','Workspace, measures, med adherence, payer submission, CGF, Quality tab, Quality analytics',ARRAY['Quality','HB POP']::TEXT[],'Teams tab: Ellie Leidner is the medical lead of the squad (Notion: Sarah Feldman for now, Ellie later in the year)',ARRAY['QUALITY']::TEXT[],4);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality:pm:einat-shafir-haviv','quality','pm','Einat Shafir Haviv','einat.shafir@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality:pm_manager:noa-bar-hillel-shushan','quality','pm_manager','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality:medical_manager:ellie-leidner','quality','medical_manager','Ellie Leidner',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality:medical_lead:sarah-feldman','quality','medical_lead','Sarah Feldman','sarah.feldman@navina.ai',NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('quality-analytics','Quality Analytics','Quality Analytics',ARRAY['Analytics']::TEXT[],'No PM on the Teams tab (Notion: Ohad Savir, no longer in HiBob). Tech lead: Ofir Barkay',ARRAY['ANALYTICS']::TEXT[],5);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality-analytics:pm:einat-shafir-haviv','quality-analytics','pm','Einat Shafir Haviv','einat.shafir@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality-analytics:pm_manager:noa-bar-hillel-shushan','quality-analytics','pm_manager','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality-analytics:medical_manager:emanuel-melaku','quality-analytics','medical_manager','Emanuel Melaku','emanuel.melaku@navina.ai','consult');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('quality-analytics:medical_lead:moti-arzuan','quality-analytics','medical_lead','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('risk-adjustment-analytics','Risk adjustment Analytics','Risk adjusment Analytics',ARRAY['Analytics']::TEXT[],'No PM on the Teams tab (Notion: Ohad Savir, no longer in HiBob). Tech lead: Ofir Barkay',ARRAY['ANALYTICS']::TEXT[],6);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-analytics:pm:ofir-barkai','risk-adjustment-analytics','pm','Ofir Barkai',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-analytics:pm_manager:ronen-gordon','risk-adjustment-analytics','pm_manager','Ronen Gordon',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-analytics:medical_manager:emanuel-melaku','risk-adjustment-analytics','medical_manager','Emanuel Melaku','emanuel.melaku@navina.ai','consult');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-adjustment-analytics:medical_lead:moti-arzuan','risk-adjustment-analytics','medical_lead','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('analytics','Analytics','Analytics platform, Analytics APIs',ARRAY['Analytics']::TEXT[],'No PM on the Teams tab (Notion: Ohad Savir, no longer in HiBob). Tech lead: Ofir Barkay',ARRAY['ANALYTICS']::TEXT[],7);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('analytics:pm:noa-bar-hillel-shushan','analytics','pm','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('analytics:pm_manager:noa-bar-hillel-shushan','analytics','pm_manager','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('analytics:medical_manager:emanuel-melaku','analytics','medical_manager','Emanuel Melaku','emanuel.melaku@navina.ai','consult');
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('analytics:medical_lead:moti-arzuan','analytics','medical_lead','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('population-health-platform','Population Health platform (POP)','Campaigns, workflows, admin and governance, risk stratification',ARRAY['HB POP','Admin']::TEXT[],NULL,ARRAY['POP_HEALTH']::TEXT[],8);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('population-health-platform:pm:noa-bar-hillel-shushan','population-health-platform','pm','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('population-health-platform:pm_manager:ronen-gordon','population-health-platform','pm_manager','Ronen Gordon',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('population-health-platform:medical_manager:sarah-feldman','population-health-platform','medical_manager','Sarah Feldman','sarah.feldman@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('population-health-platform:medical_lead:sarah-feldman','population-health-platform','medical_lead','Sarah Feldman','sarah.feldman@navina.ai',NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('risk-enterprise-solution','Risk Enterprise solution','Patient-based, NID portraits, enterprise or standard package',ARRAY['TF2']::TEXT[],NULL,ARRAY['ENTERPRISE_PACKAGE']::TEXT[],9);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-enterprise-solution:pm:avihai-binshtok','risk-enterprise-solution','pm','Avihai Binshtok','avihai.binshtok@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-enterprise-solution:pm_manager:adi-gilad','risk-enterprise-solution','pm_manager','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-enterprise-solution:sponsor:adi-gilad','risk-enterprise-solution','sponsor','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('risk-enterprise-solution:sponsor:lital-eldan','risk-enterprise-solution','sponsor','Lital Eldan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('clinic-ops','Clinic Ops','User management, File manager app, permissions, patient and cohort management',ARRAY['TF7','Admin']::TEXT[],NULL,ARRAY[]::TEXT[],10);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('clinic-ops:pm:noa-bar-hillel-shushan','clinic-ops','pm','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('clinic-ops:pm_manager:noa-bar-hillel-shushan','clinic-ops','pm_manager','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('clinic-ops:sponsor:noa-bar-hillel-shushan','clinic-ops','sponsor','Noa Bar Hillel Shushan','noa.bhs@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('clinic-ops:sponsor:tal-shachar','clinic-ops','sponsor','Tal Shachar',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('data-acquisition','Data acquisition','Ingestion of client data (claims, SDOH, OnBase, roster, CGF); exact scope to confirm',ARRAY['Data Acquisition','HB Data']::TEXT[],'Teams tab: Dolev Oz (Notion: Avihai Binshtok)',ARRAY[]::TEXT[],11);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-acquisition:pm:dolev-oz','data-acquisition','pm','Dolev Oz','dolev.oz@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-acquisition:pm_manager:ronen-gordon','data-acquisition','pm_manager','Ronen Gordon',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-acquisition:medical_manager:netanel-greifner','data-acquisition','medical_manager','Netanel Greifner',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-acquisition:medical_lead:moti-arzuan','data-acquisition','medical_lead','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('data-processing-and-transformation','Data processing and transformation','Scope to confirm',ARRAY['Data Transformation','Data Processing','HB Data']::TEXT[],NULL,ARRAY[]::TEXT[],12);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-processing-and-transformation:pm:dolev-oz','data-processing-and-transformation','pm','Dolev Oz','dolev.oz@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-processing-and-transformation:pm_manager:ronen-gordon','data-processing-and-transformation','pm_manager','Ronen Gordon',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-processing-and-transformation:medical_manager:netanel-greifner','data-processing-and-transformation','medical_manager','Netanel Greifner',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('data-processing-and-transformation:medical_lead:moti-arzuan','data-processing-and-transformation','medical_lead','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('kp-mid-atlantic','KP Mid-Atlantic','Anything related to this client, across areas',ARRAY['TF1']::TEXT[],'PM''s manager comes from HiBob (the Notion page leaves it empty)',ARRAY[]::TEXT[],13);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('kp-mid-atlantic:pm:tom-rosenberg','kp-mid-atlantic','pm','Tom Rosenberg','tom.rosenberg@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('kp-mid-atlantic:pm_manager:adi-gilad','kp-mid-atlantic','pm_manager','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('kp-mid-atlantic:medical_manager:moti-arzuan','kp-mid-atlantic','medical_manager','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('kp-mid-atlantic:sponsor:moti-arzuan','kp-mid-atlantic','sponsor','Moti Arzuan',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('kp-mid-atlantic:sponsor:ron-gross','kp-mid-atlantic','sponsor','Ron Gross',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('pre-sign-off','Pre sign off','New product in discovery for the post-visit workflow: RADV, E/M, audit review and more',ARRAY['TF3']::TEXT[],'Roei Magen reports to Shlomit Labin in HiBob. Adi Gilad as manager comes from the Notion mapping',ARRAY[]::TEXT[],14);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('pre-sign-off:pm:roei-magen','pre-sign-off','pm','Roei Magen',NULL,NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('pre-sign-off:pm_manager:adi-gilad','pre-sign-off','pm_manager','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('pre-sign-off:sponsor:adi-gilad','pre-sign-off','sponsor','Adi Gilad','adi@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('pre-sign-off:sponsor:shlomit-labin','pre-sign-off','sponsor','Shlomit Labin',NULL,NULL);
INSERT INTO "ProductArea" ("id","name","covers","teams","notes","hubAreas","sortOrder") VALUES ('care-management-platform','Care Management platform','AI-driven actions for care teams, managers and admins in one platform',ARRAY['TF4']::TEXT[],'Not in the Notion mapping. Michael Zuckerman is the product lead, Yasmin Karlin a PM on the task force',ARRAY['CARE_MANAGEMENT']::TEXT[],15);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('care-management-platform:pm:michael-zuckerman','care-management-platform','pm','Michael Zuckerman','michael@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('care-management-platform:pm:yasmin-karlin','care-management-platform','pm','Yasmin Karlin','yasmin.karlin@navina.ai',NULL);
INSERT INTO "ProductAreaOwner" ("id","areaId","role","name","email","scope") VALUES ('care-management-platform:sponsor:ronen-gordon','care-management-platform','sponsor','Ronen Gordon',NULL,NULL);
