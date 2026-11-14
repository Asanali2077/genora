# CLAUDE.md — GENORA (Business Cup 2.0)

## What we are building
GENORA: the money engine for the childcare years. B2C web app for working US parents (27–40, kids under 13, $80k–180k).
Core: Benefits Stack Optimizer (Dependent Care FSA vs care credit vs Child Tax Credit, 2026 rules), School-break radar with PTO planning, Claim vault for FSA receipts.
Docs: `docs/HACKATHON_BRIEF.md` (rules and judging weights — check every decision against it), `docs/ARCHITECTURE.md`, `docs/STRATEGY.md`, `PLAN.md`.

## Non-negotiables
1. **Core value is real.** Money numbers come only from `lib/engine` (pure, deterministic, unit-tested). AI only extracts structured data from messy input; it never produces tax numbers. No faked or hardcoded results; demo data is labelled.
2. **Free stack only:** Supabase Free, Vercel Hobby, Gemini free key. No paid services or billing without the user's explicit permission. Anthropic stays optional behind `ALLOW_PAID_AI=true`.
3. **Every tax constant has a source** in `lib/engine/tax-2026.ts`; every engine rule has a test in `tests/unit`.
4. **Security:** secrets only in `.env.local`; service role key server-only; RLS on every table; no SSNs collected; receipts in a private bucket.
5. **UI in English** for US users. Product copy lives in `config/site.ts`, not in components.
6. **Every AI call:** Zod schema, timeout, one retry, and a manual fallback instead of invented data.
7. After each phase: `npm run lint`, `npm run build`, `npm test`, browser check at 390px and desktop, commit, push, tick `PLAN.md`.
8. Database changes: write a migration in `supabase/migrations`; the user runs destructive SQL in the SQL Editor (the MCP apply call hangs on confirmation in this environment).

## Design
"Evening violet" theme, tokens in `app/globals.css`: brand `#5b4ae6` (product, trust), brand-deep `#22185a` (hero surfaces), sun `#ffc83d` (found money only), sky `#9dcbff` (no-school days), good `#13a06f` / bad `#e5534b` (money in / out), ink `#17161f`, paper `#f6f5fa`, line `#e6e4ef`. Never hard-code hexes in components; use the token classes (`bg-brand`, `text-sun`, `bg-wash`...).
Type: Unbounded (`.display`) for page titles and money figures only; Onest for everything else. Both carry Cyrillic.
Layout: every app screen sits in the shell's one centred frame (`FRAME` in `components/app/shell.tsx`, max 1160px); pages never set their own width or side padding. Navigation comes from `config/nav.ts`.
One signature move per screen; no generic SaaS card grids, no ALL-CAPS eyebrows, no decorative motion. Mobile first (390px), visible focus, AA contrast, tap targets ≥ 44px, `prefers-reduced-motion`.
## Environment
Windows + PowerShell; npm scripts must be cross-platform. Next.js 16 (App Router, `proxy.ts` instead of middleware — read `node_modules/next/dist/docs` before using an API). Node 20 locally (supabase-js needs the `ws` transport), Node 22+ on Vercel.
