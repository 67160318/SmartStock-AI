# Supabase setup

## Connected v0 project

The SmartStock schema and tenant-scoped RLS policies have been applied to the connected Supabase project through the Supabase integration. The live schema contains the 14 application tables with RLS enabled. A follow-up unique index enforces the one-restaurant-per-user onboarding rule. No demo rows or destructive resets were run.

The ordered migration files are:

1. `supabase/migrations/20261009132709_initial_smartstock_schema.sql`
2. `supabase/migrations/20261009132730_smartstock_membership_constraints.sql`
3. `supabase/migrations/20261009132747_smartstock_verify_schema.sql` (history marker only; no-op)

For a new, empty Supabase project, apply the SQL migration files in order using the Supabase SQL Editor or your normal migration workflow. Do not run the initial schema migration a second time against the already-connected project, and never use `supabase db reset` against a project containing data.

## Authentication setup

SmartStock uses Supabase email/password authentication. Email confirmation is respected: users must follow the confirmation email before onboarding. Make sure the Supabase Auth email provider can deliver to the test mailbox, and allow the app's `/auth/callback` URL for both preview and deployed origins. The app's callback exchanges the one-time code for a cookie-backed session.

## Safe connection check

`GET /api/health` makes a read-only call to `smartstock_connection_check`. It returns only `{"status":"connected"}` or `{"status":"unavailable"}` and never returns credentials, user data, or database error details.

## Environment

The connected v0 project already has these public variables configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (v0 preview auth redirect proxy)

These values are public project identifiers/keys. Never expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in browser code or `NEXT_PUBLIC_` variables.
