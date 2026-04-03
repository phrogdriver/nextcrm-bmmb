-- Add voicemail to activity type enum
ALTER TYPE "crm_Activity_Type" ADD VALUE IF NOT EXISTS 'voicemail' AFTER 'call';
