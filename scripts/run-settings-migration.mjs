// Run settings module migration via Supabase Management API
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/run-settings-migration.mjs
//
// Falls back to printing SQL if Management API fails.

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = resolve(__dirname, "../supabase/migrations/20260530000000_settings_module.sql");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Run:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/run-settings-migration.mjs");
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
const sql = readFileSync(MIGRATION_PATH, "utf-8");

async function runMigration() {
  console.log("Running settings module migration...");
  console.log("  Project ref:", projectRef);
  console.log("  Migration:", MIGRATION_PATH);
  console.log("");

  const mgmtEndpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const resp = await fetch(mgmtEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error("Management API failed:", JSON.stringify(body, null, 2));
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Run manually in Supabase SQL Editor:");
    console.log("  https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
    console.log("");
    console.log(sql);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(0);
  }

  console.log("Migration succeeded:", JSON.stringify(body, null, 2));
}

runMigration().catch(console.error);
