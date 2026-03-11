-- 0006: Enable Row Level Security on all tables
-- Policies should be customized based on auth requirements

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;

-- Default: allow authenticated users full access (customize later)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contacts_all_authenticated') THEN
    CREATE POLICY contacts_all_authenticated ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'companies_all_authenticated') THEN
    CREATE POLICY companies_all_authenticated ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interactions_all_authenticated') THEN
    CREATE POLICY interactions_all_authenticated ON interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reminders_all_authenticated') THEN
    CREATE POLICY reminders_all_authenticated ON reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contact_groups_all_authenticated') THEN
    CREATE POLICY contact_groups_all_authenticated ON contact_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cgm_all_authenticated') THEN
    CREATE POLICY cgm_all_authenticated ON contact_group_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
