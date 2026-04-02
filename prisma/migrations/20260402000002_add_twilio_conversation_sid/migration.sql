ALTER TABLE "crm_Conversations" ADD COLUMN "twilioConversationSid" TEXT;
CREATE UNIQUE INDEX "crm_Conversations_twilioConversationSid_key" ON "crm_Conversations"("twilioConversationSid");
CREATE INDEX "crm_Conversations_twilioConversationSid_idx" ON "crm_Conversations"("twilioConversationSid");
