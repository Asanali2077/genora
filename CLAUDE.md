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
Light "kitchen calendar after bedtime" theme: pine `#0f5c4d` (trust), marigold `#f2b705` (found money, used sparingly), sky `#cfe3f5` (no-school days), ink `#172a26`, paper `#f6f8f7`. Bricolage Grotesque for headings and money figures, Figtree for text.
One signature move per screen; no generic SaaS card grids, no ALL-CAPS eyebrows, no decorative motion. Mobile first (390px), visible focus, AA contrast, tap targets ≥ 44px, `prefers-reduced-motion`.

## Environment
Windows + PowerShell; npm scripts must be cross-platform. Next.js 16 (App Router, `proxy.ts` instead of middleware — read `node_modules/next/dist/docs` before using an API). Node 20 locally (supabase-js needs the `ws` transport), Node 22+ on Vercel.
