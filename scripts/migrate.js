#!/usr/bin/env node
/**
 * Simple migration runner — reads SQL files from migrations/ in order
 * and executes them against the Supabase database via the REST API.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate.js
 *
 * For production, consider using supabase CLI migrations instead.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

async function runMigrations() {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Running ${file}...`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`  Warning: ${file} — ${res.status}: ${text}`);
      console.warn('  (Run migrations directly via Supabase SQL editor or psql for best results)');
    } else {
      console.log(`  ✓ ${file}`);
    }
  }

  console.log('Migration run complete.');
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
