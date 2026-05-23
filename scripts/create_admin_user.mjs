/*
Create a Supabase admin user using SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
Usage:
  SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co node scripts/create_admin_user.mjs admin@example.com Password123

This script will create a user and set `app_metadata.role = "admin"` so the app can recognize admin users.
*/

import { argv } from 'process';

async function main() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !url) {
    console.error('Missing environment variables. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL');
    process.exit(2);
  }

  const email = argv[2];
  const password = argv[3] || 'Admin1234';

  if (!email) {
    console.error('Usage: node scripts/create_admin_user.mjs admin@example.com [password]');
    process.exit(2);
  }

  const endpoint = `${url.replace(/\/+$/,'')}/auth/v1/admin/users`;

  const body = {
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' }
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log('status:', res.status);
    console.log(text);

    if (!res.ok) process.exit(1);
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(1);
  }
}

main();
