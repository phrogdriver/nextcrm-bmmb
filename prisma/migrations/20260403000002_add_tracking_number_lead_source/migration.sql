ALTER TABLE "crm_Tracking_Numbers" ADD COLUMN "leadSourceId" UUID;

ALTER TABLE "crm_Tracking_Numbers"
  ADD CONSTRAINT "crm_Tracking_Numbers_leadSourceId_fkey"
  FOREIGN KEY ("leadSourceId") REFERENCES "crm_Lead_Sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
