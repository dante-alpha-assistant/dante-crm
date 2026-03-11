-- 0007: Add snoozed_until to reminders for snooze functionality
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_reminders_snoozed ON reminders (snoozed_until) WHERE snoozed_until IS NOT NULL AND completed_at IS NULL;
