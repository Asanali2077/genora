---
description: Verify GENORA and ship it to production (Vercel), then confirm it works there
---

Run in order and stop at the first failure (fix it, then continue):

1. `npm run lint`
2. `npm test` (engine unit tests)
3. `npm run build`
4. `npx playwright test` (full path locally)
5. `git push` — Vercel deploys `main` automatically (functions run in `syd1`, next to Supabase)
6. After ~2 minutes: `curl https://businesscup.vercel.app/api/health` must return `"ok":true`
7. Production end-to-end: `BASE_URL=https://businesscup.vercel.app npx playwright test --repeat-each 2`

Report each step as passed or failed with the output. Never print secret values.
