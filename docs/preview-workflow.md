# Preview and Staging Workflow

Use this workflow for upgrades so the live operations website and production Supabase data stay protected.

## Safety Rules

- Keep production on `main`.
- Build upgrade work on a separate branch, for example `codex/preview-staging-setup`.
- Do not deploy a branch to production until it has been tested.
- If preview deployments point at the production Supabase project, set `NEXT_PUBLIC_SITE_ENV=preview` so writes are simulated locally and never sent to Supabase.
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

Create `.env.local` from `.env.preview.example`. If a preview Supabase project is not available yet, you can temporarily use production Supabase values as long as `NEXT_PUBLIC_SITE_ENV=preview` is set.

```powershell
npm.cmd install
npm.cmd run dev
```

Then test the site locally at:

```text
http://localhost:3000
```

## Preview Safety Mode

When `NEXT_PUBLIC_SITE_ENV=preview`, the app runs in preview safety mode:

- The app can read from Supabase.
- Missing-part submissions are added only to local browser state.
- Dashboard status and ETA updates are changed only in local browser state.
- Sub-build additions and status updates are changed only in local browser state.
- Refreshing the page clears simulated preview changes.
- A preview banner appears at the top of the app.

This mode lets preview deployments use production Supabase for read-only testing without writing test data to live operations tables.

## Preview Supabase

When budget allows, create a separate Supabase project for preview/staging. In that preview project, run the SQL from:

```text
supabase/schema.sql
```

Use the preview project's URL and publishable key for local `.env.local` and Vercel preview environment variables. Keep `NEXT_PUBLIC_SITE_ENV=preview` for preview deployments unless the preview database is intentionally allowed to accept test writes.

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

The important part is that Preview sets `NEXT_PUBLIC_SITE_ENV=preview`. If Preview points to production Supabase, this keeps Preview read-only at the app layer. When a separate preview Supabase project is available, Preview can point to that project instead.

## Release Checklist

Before promoting a preview change to production:

- Run `npm.cmd run build`.
- Open the preview deployment and test `Dashboard`, `Submit`, `Monitor`, `History`, `Closed`, and `Subs`.
- Submit a test record in preview and confirm the preview banner is visible.
- Refresh the preview page and confirm the simulated test record disappears.
- Confirm production Supabase has no test records from preview.
- If the change includes a Supabase schema file, apply the safe `alter table ... add column if not exists` SQL before deploying the production website.
- Merge to `main` only after preview testing passes.
- Keep the previous production deployment available for rollback.
