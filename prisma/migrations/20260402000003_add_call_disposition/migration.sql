-- Call disposition enum and fields on crm_Activities
CREATE TYPE "crm_Call_Disposition" AS ENUM ('booked', 'not_interested', 'wrong_number', 'spam', 'existing_customer', 'no_response');

ALTER TABLE "crm_Activities" ADD COLUMN "disposition" "crm_Call_Disposition";
ALTER TABLE "crm_Activities" ADD COLUMN "dispositionNote" TEXT;
ALTER TABLE "crm_Activities" ADD COLUMN "dispositionAt" TIMESTAMP(3);
ALTER TABLE "crm_Activities" ADD COLUMN "dispositionBy" UUID;

CREATE INDEX "crm_Activities_disposition_idx" ON "crm_Activities"("disposition");

ALTER TABLE "crm_Activities"
  ADD CONSTRAINT "crm_Activities_dispositionBy_fkey"
  FOREIGN KEY ("dispositionBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
