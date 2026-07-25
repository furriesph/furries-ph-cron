/**
 * reconcile-social-entitlements.js
 *
 * Standalone Node.js script (no dependencies, Node 18+ built-in fetch).
 * Calls the partners-api internal reconciliation endpoint so attendee Discord
 * roles and Telegram member tags are retried for active regos after late
 * account linking, late server joins, or transient provider failures.
 *
 * Required env vars:
 *   CRON_SECRET      - shared secret set in partners-api
 *
 * Optional env vars:
 *   PARTNERS_API_URL - defaults to https://api.furries.ph
 *
 * Run:
 *   node reconcile-social-entitlements.js
 */

const API_URL = (process.env.PARTNERS_API_URL ?? 'https://api.furries.ph').replace(/\/$/, '')
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error('Missing CRON_SECRET')
  process.exit(1)
}

async function reconcileSocialEntitlements() {
  const res = await fetch(`${API_URL}/api/internal/social-entitlements/reconcile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Cron-Secret': CRON_SECRET,
    },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    throw new Error(`social-entitlements reconcile responded ${res.status}: ${await res.text()}`)
  }

  return await res.json()
}

async function main() {
  console.log(`[${new Date().toISOString()}] Reconciling active social entitlements...`)
  const result = await reconcileSocialEntitlements()
  console.log(`Scanned ${result.scanned ?? 0} attendee(s); reconciled ${result.reconciled ?? 0}; failed ${result.failed ?? 0}.`)

  if (Array.isArray(result.failures) && result.failures.length > 0) {
    for (const failure of result.failures.slice(0, 20)) {
      console.log(`- ${failure.attendeeId}: ${failure.error}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})