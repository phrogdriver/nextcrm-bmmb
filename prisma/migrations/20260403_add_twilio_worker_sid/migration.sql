-- Add Twilio TaskRouter Worker SID to Users
ALTER TABLE "Users" ADD COLUMN "twilioWorkerSid" TEXT;
