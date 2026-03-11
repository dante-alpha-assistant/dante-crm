-- 0007: Add full-text search support for contacts
-- Creates a GIN index for full-text search across name, email, company, notes

CREATE INDEX IF NOT EXISTS idx_contacts_fulltext
  ON contacts USING gin (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, '') || ' ' || coalesce(notes, ''))
  );
