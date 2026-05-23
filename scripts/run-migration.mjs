// One-time migration runner using Supabase service role
// Run: node scripts/run-migration.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Run: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/run-migration.mjs");
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];

const sql = `
alter table public.orders 
  add column if not exists courier_name text,
  add column if not exists tracking_code text;
`;

async function runMigration() {
  console.log("🚀 Running courier columns migration...");
  console.log("   Project ref:", projectRef);
  console.log("   SQL:", sql.trim());
  console.log("");

  // Try Supabase Management API (pg/query endpoint)
  const mgmtEndpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const resp = await fetch(mgmtEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error("❌ Management API failed:", JSON.stringify(body, null, 2));
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Please run this SQL manually in Supabase SQL Editor:");
    console.log("   https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
    console.log("");
    console.log("-- SQL to run:");
    console.log(sql.trim());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(0);
  }

  console.log("✅ Migration succeeded:", JSON.stringify(body, null, 2));
}

runMigration().catch(console.error);
