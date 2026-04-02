-- Add Twilio fields to crm_Conversations
ALTER TABLE "crm_Conversations" ADD COLUMN "twilioCallSid" TEXT;
ALTER TABLE "crm_Conversations" ADD COLUMN "twilioCallStatus" TEXT;
ALTER TABLE "crm_Conversations" ADD COLUMN "twilioRecordingUrl" TEXT;
ALTER TABLE "crm_Conversations" ADD COLUMN "callDirection" TEXT;
ALTER TABLE "crm_Conversations" ADD COLUMN "callDuration" INTEGER;
ALTER TABLE "crm_Conversations" ADD COLUMN "trackingNumberId" UUID;

CREATE UNIQUE INDEX "crm_Conversations_twilioCallSid_key" ON "crm_Conversations"("twilioCallSid");
CREATE INDEX "crm_Conversations_twilioCallSid_idx" ON "crm_Conversations"("twilioCallSid");
CREATE INDEX "crm_Conversations_trackingNumberId_idx" ON "crm_Conversations"("trackingNumberId");

-- CreateTable: crm_Messages
CREATE TABLE "crm_Messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL,
  "direction" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "twilioMessageSid" TEXT,
  "twilioStatus" TEXT,
  "sentBy" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_Messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_Messages_twilioMessageSid_key" ON "crm_Messages"("twilioMessageSid");
CREATE INDEX "crm_Messages_conversationId_createdAt_idx" ON "crm_Messages"("conversationId", "createdAt");
CREATE INDEX "crm_Messages_twilioMessageSid_idx" ON "crm_Messages"("twilioMessageSid");

ALTER TABLE "crm_Messages"
  ADD CONSTRAINT "crm_Messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "crm_Conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_Messages"
  ADD CONSTRAINT "crm_Messages_sentBy_fkey"
  FOREIGN KEY ("sentBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: crm_Tracking_Numbers
CREATE TABLE "crm_Tracking_Numbers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "phoneNumber" TEXT NOT NULL,
  "friendlyName" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "campaign" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "crm_Tracking_Numbers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_Tracking_Numbers_phoneNumber_key" ON "crm_Tracking_Numbers"("phoneNumber");
CREATE INDEX "crm_Tracking_Numbers_phoneNumber_idx" ON "crm_Tracking_Numbers"("phoneNumber");
CREATE INDEX "crm_Tracking_Numbers_isActive_idx" ON "crm_Tracking_Numbers"("isActive");

-- Add FK from conversations to tracking numbers
ALTER TABLE "crm_Conversations"
  ADD CONSTRAINT "crm_Conversations_trackingNumberId_fkey"
  FOREIGN KEY ("trackingNumberId") REFERENCES "crm_Tracking_Numbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
