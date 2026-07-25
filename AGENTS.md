# AGENTS.md

## Shared Updates Page

- When changes in this repo alter behavior, setup, release process, documentation, public contracts, or operator expectations, update `../docs.furries.ph/src/pages/updates.md` in the same work session.
- Write the entry for a public-facing audience: affected repo, what changed, who may notice it, what to do next, and validation evidence.
- Local commits are recorded by `.githooks/post-commit`, which calls `../docs.furries.ph/scripts/record-update-commit.mjs` so every commit is listed in the shared updates page as it happens.
- Do not include secrets, private IDs, raw tokens, or internal-only debugging notes.
- The main `furries.ph` site is excluded from this shared update-log requirement.
