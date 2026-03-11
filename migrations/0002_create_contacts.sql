-- 0002: Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  role text,
  avatar_url text,
  notes text,
  tags text[] DEFAULT '{}',
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'linkedin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts (name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts (company);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts (source);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING gin (tags);
