/**
 * archive-expired-events.js
 *
 * Standalone Node.js script (no dependencies, Node 18+ built-in fetch).
 * Calls the partners-api to archive events whose end date or registration
 * close time has passed, then triggers a rego.furries.ph rebuild.
 *
 * Required env vars:
 *   CRON_SECRET          - shared secret set in partners-api (wrangler secret put CRON_SECRET)
 *
 * Optional env vars:
 *   PARTNERS_API_URL     - defaults to https://api.furries.ph
 *
 * Run:
 *   node archive-expired-events.js
 */

const API_URL = (process.env.PARTNERS_API_URL ?? 'https://api.furries.ph').replace(/\/$/, '')
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error('Missing CRON_SECRET')
  process.exit(1)
}

async function archiveExpired() {
  const res = await fetch(`${API_URL}/api/rego/internal/archive-expired`, {
    method: 'POST',
    headers: { 'X-Cron-Secret': CRON_SECRET },
  })
  if (!res.ok) throw new Error(`archive-expired responded ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function main() {
  console.log(`[${new Date().toISOString()}] Checking for expired events…`)
  const result = await archiveExpired()
  if (result.archived === 0) {
    console.log('No expired events found.')
  } else {
    console.log(`✓ Archived ${result.archived} event(s). Rego rebuild triggered.`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
