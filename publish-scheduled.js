/**
 * publish-scheduled.js
 *
 * Standalone Node.js script (no dependencies, Node 18+ built-in fetch).
 * Finds draft post/guide documents with scheduledPublishAt <= now and publishes them.
 * Also fires the Cloudflare Pages deploy hook if CF_DEPLOY_HOOK_URL is set.
 *
 * Required env vars:
 *   SANITY_AUTH_TOKEN   — Sanity write token
 *   CF_DEPLOY_HOOK_URL  — (optional) Cloudflare Pages deploy hook URL
 *
 * Run:
 *   node publish-scheduled.js
 */

const PROJECT_ID = '8dgp43z0'
const DATASET = 'production'
const API_VERSION = '2024-01-01'

const TOKEN = process.env.SANITY_AUTH_TOKEN
const CF_DEPLOY_HOOK_URL = process.env.CF_DEPLOY_HOOK_URL ?? ''

if (!TOKEN) {
  console.error('Missing SANITY_AUTH_TOKEN')
  process.exit(1)
}

const BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data`
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
}

async function fetchDueDrafts() {
  const now = new Date().toISOString()
  const query = `*[_id in path("drafts.**") && _type in ["posts","guide"] && defined(scheduledPublishAt) && scheduledPublishAt <= "${now}"]`
  const url = `${BASE}/query/${DATASET}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, {headers: HEADERS})
  if (!res.ok) throw new Error(`Query failed ${res.status}: ${await res.text()}`)
  return (await res.json()).result
}

async function publishDoc(draft) {
  const publishedId = draft._id.replace(/^drafts\./, '')
  const published = {...draft, _id: publishedId}
  delete published.scheduledPublishAt

  const res = await fetch(`${BASE}/mutate/${DATASET}?returnIds=true`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      mutations: [
        {createOrReplace: published},
        {delete: {id: draft._id}},
      ],
    }),
  })
  if (!res.ok) throw new Error(`Mutate failed ${res.status}: ${await res.text()}`)
  console.log(`  ✓ Published ${publishedId}`)
}

async function triggerDeploy() {
  if (!CF_DEPLOY_HOOK_URL) { console.log('  No CF_DEPLOY_HOOK_URL set, skipping.'); return }
  const res = await fetch(CF_DEPLOY_HOOK_URL, {method: 'POST'})
  console.log(res.ok ? '  ✓ Deploy triggered.' : `  ⚠ Deploy hook responded ${res.status}`)
}

async function main() {
  console.log(`[${new Date().toISOString()}] Checking for scheduled documents…`)
  const drafts = await fetchDueDrafts()
  if (!drafts.length) { console.log('Nothing to publish.'); return }

  console.log(`Found ${drafts.length} document(s) to publish.`)
  let published = 0
  for (const draft of drafts) {
    try { await publishDoc(draft); published++ }
    catch (e) { console.error(`  ✗ ${draft._id}:`, e.message) }
  }

  if (published > 0) await triggerDeploy()
  console.log(`Done. ${published}/${drafts.length} published.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
