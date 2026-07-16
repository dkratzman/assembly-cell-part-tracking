# Preview and Staging Workflow

Use this workflow for upgrades so the live operations website and production Supabase data stay protected.

## Safety Rules

- Keep production on `main`.
- Build upgrade work on a separate branch, for example `codex/preview-staging-setup`.
- Do not deploy a branch to production until it has been tested.
- Do not point preview deployments at the production Supabase project.
- Do not run schema changes against production Supabase while testing.

## Branch Flow

```powershell
git switch main
git pull
git switch -c codex/your-upgrade-name
```

Make and test changes on the branch. When ready, push the branch:

```powershell
git push -u origin codex/your-upgrade-name
```

If Vercel is connected to the repository, the pushed branch should create a preview deployment. The production URL should not change unless the branch is merged to `main` or deployed with a production deployment.

## Local Testing

Create `.env.local` from `.env.preview.example` and use preview Supabase values, not production values.

```powershell
npm.cmd install
npm.cmd run dev
```

Then test the site locally at:

```text
http://localhost:3000
```

## Preview Supabase

Create a separate Supabase project for preview/staging. In that preview project, run the SQL from:

```text
supabase/schema.sql
```

Use the preview project's URL and publishable key for local `.env.local` and Vercel preview environment variables.

## Vercel Environment Variables

In Vercel, configure these values separately for Preview and Production:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_ENV
```

Recommended values:

```text
Preview NEXT_PUBLIC_SITE_ENV=preview
Production NEXT_PUBLIC_SITE_ENV=production
```

The important part is that Preview points to the preview Supabase project, while Production points to the production Supabase project.

## Release Checklist

Before promoting a preview change to production:

- Run `npm.cmd run build`.
- Open the preview deployment and test `Dashboard`, `Submit`, `Monitor`, `History`, `Closed`, and `Subs`.
- Submit a test record in preview and confirm it only appears in preview Supabase.
- Confirm production Supabase has no test records from preview.
- Merge to `main` only after preview testing passes.
- Keep the previous production deployment available for rollback.
