-- CreateEnum
CREATE TYPE "crm_Conversation_Channel" AS ENUM ('phone', 'sms', 'chat');
CREATE TYPE "crm_Conversation_Status" AS ENUM ('open', 'closed');

-- CreateTable
CREATE TABLE "crm_Conversations" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "channel"        "crm_Conversation_Channel" NOT NULL,
  "phoneNumber"    TEXT,
  "subject"        TEXT,
  "status"         "crm_Conversation_Status" NOT NULL DEFAULT 'open',
  "contactId"      UUID,
  "leadId"         UUID,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy"      UUID,
  "updatedBy"      UUID,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3),
  "deletedAt"      TIMESTAMP(3),
  "deletedBy"      UUID,
  CONSTRAINT "crm_Conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "crm_Conversations_phoneNumber_idx" ON "crm_Conversations"("phoneNumber");
CREATE INDEX "crm_Conversations_contactId_idx" ON "crm_Conversations"("contactId");
CREATE INDEX "crm_Conversations_leadId_idx" ON "crm_Conversations"("leadId");
CREATE INDEX "crm_Conversations_lastActivityAt_idx" ON "crm_Conversations"("lastActivityAt");
CREATE INDEX "crm_Conversations_status_idx" ON "crm_Conversations"("status");
CREATE INDEX "crm_Conversations_deletedAt_idx" ON "crm_Conversations"("deletedAt");
CREATE INDEX "crm_Conversations_channel_status_idx" ON "crm_Conversations"("channel", "status");

-- AddForeignKeys
ALTER TABLE "crm_Conversations"
  ADD CONSTRAINT "crm_Conversations_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "crm_Contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_Conversations"
  ADD CONSTRAINT "crm_Conversations_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "crm_Leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_Conversations"
  ADD CONSTRAINT "crm_Conversations_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_Conversations"
  ADD CONSTRAINT "crm_Conversations_updatedBy_fkey"
  FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
