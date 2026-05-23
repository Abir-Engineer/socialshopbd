This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local setup (Supabase)

1. Copy the environment example and fill values from your Supabase project:

```bash
cp .env.example .env.local
# then edit .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

3. Apply the SQL migrations in `supabase/migrations` to your Supabase database (use the Supabase CLI or Dashboard).

4. To create an admin user (requires `SUPABASE_SERVICE_ROLE_KEY`):

```bash
SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co node scripts/create_admin_user.mjs hello.marketerabir@gmail.com MySecurePass123
```

5. Optional: create test users with `scripts/create_test_user.mjs` (also requires service role key).

## GitHub Actions CI

This repository includes a basic CI workflow at `.github/workflows/ci.yml`.

It runs on pushes and pull requests to `main` or `master`, and performs:

- `npm install`
- `npm run lint`
- `npm run build`

If you want to enable deployment or migration automation, add GitHub Secrets to the repo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only secret)


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
