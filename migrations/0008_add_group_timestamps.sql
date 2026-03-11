-- 0008: Add timestamps to contact_groups
ALTER TABLE contact_groups ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE contact_groups ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add joined_at to membership for tracking when contacts were added
ALTER TABLE contact_group_members ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();
