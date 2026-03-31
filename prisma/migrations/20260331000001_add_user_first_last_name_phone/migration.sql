-- AlterTable: add first_name, last_name, phone to Users
ALTER TABLE "Users" ADD COLUMN "first_name" TEXT;
ALTER TABLE "Users" ADD COLUMN "last_name" TEXT;
ALTER TABLE "Users" ADD COLUMN "phone" TEXT;

-- Backfill: split existing "name" into first_name / last_name
UPDATE "Users"
SET
  "first_name" = SPLIT_PART("name", ' ', 1),
  "last_name"  = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE NULL
  END
WHERE "name" IS NOT NULL;
