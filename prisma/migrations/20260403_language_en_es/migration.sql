-- First update users with old language values to 'en' (using existing enum values only)
UPDATE "Users" SET "userLanguage" = 'en' WHERE "userLanguage" NOT IN ('en');

-- Replace the Language enum with en + es only
ALTER TYPE "Language" RENAME TO "Language_old";
CREATE TYPE "Language" AS ENUM ('en', 'es');
ALTER TABLE "Users" ALTER COLUMN "userLanguage" DROP DEFAULT;
ALTER TABLE "Users" ALTER COLUMN "userLanguage" TYPE "Language" USING ("userLanguage"::text::"Language");
ALTER TABLE "Users" ALTER COLUMN "userLanguage" SET DEFAULT 'en';
DROP TYPE "Language_old";
