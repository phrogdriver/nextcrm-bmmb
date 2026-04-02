-- Drop channel column and enum from crm_Conversations
DROP INDEX IF EXISTS "crm_Conversations_channel_status_idx";
ALTER TABLE "crm_Conversations" DROP COLUMN IF EXISTS "channel";
DROP TYPE IF EXISTS "crm_Conversation_Channel";
