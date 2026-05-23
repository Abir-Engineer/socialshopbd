/*
Create a Supabase test user using SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
Usage:
  SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co node scripts/create_test_user.mjs

This script POSTs to the Supabase admin endpoint and prints the response.
*/

import { argv } from 'process';

async function main() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !url) {
    console.error('Missing environment variables. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL');
    process.exit(2);
  }

  const emailArg = argv[2];
  const email = emailArg || `e2e+${Date.now()}@example.com`;
  const password = 'Test1234';

  const endpoint = `${url.replace(/\/+$/,'')}/auth/v1/admin/users`;

  const body = {
    email,
    password,
    email_confirm: true
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
