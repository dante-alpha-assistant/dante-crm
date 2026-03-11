-- 0005: Create contact groups and membership
CREATE TABLE IF NOT EXISTS contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text,
  description text
);

CREATE TABLE IF NOT EXISTS contact_group_members (
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_cgm_group ON contact_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_cgm_contact ON contact_group_members (contact_id);
