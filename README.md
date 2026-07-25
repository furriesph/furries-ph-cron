# furries-ph-cron

Small standalone cron runners for the Furries PH platform.

## Scripts

- `node archive-expired-events.js`
  - Calls `POST /api/rego/internal/archive-expired` on `partners-api`.
  - Requires `CRON_SECRET`.

- `node reconcile-social-entitlements.js`
  - Calls `POST /api/internal/social-entitlements/reconcile` on `partners-api`.
  - Replays Discord role and Telegram member-tag reconciliation for attendees with active regos, which covers late social linking, late Discord server joins, and transient sync failures.
  - Requires `CRON_SECRET`.

## Environment

- `CRON_SECRET`
- `PARTNERS_API_URL` optional, defaults to `https://api.furries.ph`
