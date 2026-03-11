-- 0003: Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'message')),
  summary text,
  details text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions (contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions (type);
CREATE INDEX IF NOT EXISTS idx_interactions_occurred ON interactions (occurred_at DESC);
