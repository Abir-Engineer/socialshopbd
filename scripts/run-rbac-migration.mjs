// scripts/run-rbac-migration.mjs
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gfprbyvlkvuwbiplziqf.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmcHJieXZsa3Z1d2JpcGx6aXFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI2NjgxOSwiZXhwIjoyMDkzODQyODE5fQ.Inh7QaUE-GLv11k06PjPiEMIau1yR2aLwjV4rOguRTQ";

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
const migrationPath = path.resolve("supabase/migrations/20260523000008_role_based_access.sql");
const sql = fs.readFileSync(migrationPath, "utf-8");

async function runMigration() {
  console.log("🚀 Running RBAC and security policy migrations...");
  console.log("   Project ref:", projectRef);
  console.log("");

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
    console.error("❌ Migration failed:", JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("✅ Migration succeeded! Output:", JSON.stringify(body, null, 2));
}

runMigration().catch(console.error);
