# Assembly Cell Part Tracking

Simple missing-parts tracker for the Assembly Cell Section.

## MVP Views

- `Dashboard`: live editable controller view for active missing parts.
- `Submit`: fast workstation form for any technician, TL, or controller.
- `Monitor`: read-only live dashboard for leads and leadership.
- `History`: audit log for created records and status or ETA changes.

## Local Setup

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Create `.env.local` from `.env.example` and add your Supabase project values:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```

3. In Supabase SQL Editor, run:

   ```text
   supabase/schema.sql
   ```

4. Start the app:

   ```powershell
   npm.cmd run dev
   ```

## Deployment

Deploy the repository to Vercel and add the same Supabase environment variables in the Vercel project settings.
