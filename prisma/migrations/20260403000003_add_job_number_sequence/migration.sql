-- Create a sequence for job numbers starting at 100
CREATE SEQUENCE IF NOT EXISTS job_number_seq START WITH 100 INCREMENT BY 1;

-- Set default for job_number column
ALTER TABLE "crm_Opportunities" ALTER COLUMN "job_number" SET DEFAULT CAST(nextval('job_number_seq') AS TEXT);

-- Backfill existing rows that don't have a job_number
UPDATE "crm_Opportunities" SET "job_number" = CAST(nextval('job_number_seq') AS TEXT) WHERE "job_number" IS NULL;
