# Handover — adfixus-id-simulator (ID Durability Simulator)

## The AdFixus tool family (read this first)

You are taking over **three** related tools that share one brand, one design
system, and one calculation engine (`src/core`):

| Repo | What it is | Access |
|------|------------|--------|
| **adfixus-id-simulator** (this repo) | Public lead magnet — configurable **ID durability** simulator | Public, embeddable |
| **adfixus-capi-calculator** | Public lead magnet — **CAPI Sales-Plan** simulator (ramp + deal models) | Public, embeddable |
| **adfixus-sales** | Internal **Target Business Report Card** (live enrichment + v6 rubric) | Team-only (Vercel SSO) |

The shared engine, design tokens, and embedding protocol are documented once, for
all three, in **[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)** (identical
in every repo).

## What this repo is for

A publisher enters a few inputs (monthly pageviews, display/video CPMs, Safari
share, ads/page, execution outlook) and instantly sees the revenue lost to
unaddressable Safari/ITP traffic and what durable identity would recover — with an
addressability waterfall, a ramp chart, metric cards, and a downloadable PDF. It
is **fully configurable** and designed to be **iframed into adfixus.com**.

## Architecture — where the math lives

- **100% client-side.** No backend, no login, no secrets.
- **The math lives in `src/core`** — the shared, verified engine. The UI hook
  `src/hooks/useIdSimulator.ts` builds inputs and calls
  `UnifiedCalculationEngine.calculate(inputs, { scope: 'id-only' }, risk,
  overrides)`; results components read `results.idInfrastructure`. Charts use
  `UnifiedCalculationEngine.generateMonthlyProjection(results)`.
- **Fully-configurable surface:**
  - `BasicInputs.tsx` — pageviews, display/video CPM, execution outlook (risk).
  - `AdvancedPanel.tsx` ("Configure assumptions") — Safari share, baseline &
    recovered addressability, CPM-uplift factor, contextual-CPM ratio, CDP savings,
    plus the **8 readiness sliders** (sales readiness, advertiser buy-in,
    organisational ownership, market conditions, training, integration reliability,
    resource availability, technical deployment). These flow into the engine as
    `AssumptionOverrides` (see core spec §2.2).
  - `DomainPortfolio.tsx` — model 1..N domains (aggregated by the engine).
- **Leads:** captured to `localStorage["adfixus_leads"]` through the pluggable
  `leadAdapter`; swap in a CRM later without touching the UI.

## How to change assumptions / benchmarks

- **Defaults / formulas:** `src/core/constants/benchmarks.ts` (addressability, CPM
  uplift, CDP savings) and `riskScenarios.ts`. Re-run the golden-values self-check
  after (core spec §3.5). This repo is `id-only`, so it never touches CAPI/media
  or `pricingConfig`.
- **Per-run overrides:** the advanced panel already surfaces these via
  `AssumptionOverrides`; add a new lever by extending the panel + the overrides
  object — no engine change needed.

## Design system

Dark theme, AdFixus bright-cyan accent — **identical** to the other two tools. HSL
tokens in `src/index.css` (`:root`) + `tailwind.config.ts`: `--background: 0 0% 0%`
(black), `--primary: 195 95% 50%` (cyan), `--primary-glow: 195 95% 60%`,
`--card: 0 0% 6%`, `--radius: 1rem`; body font **Montserrat** (Google Fonts
`<link>` in `index.html`). Full token list + utility classes in the core spec §4.

## What you need to do next

1. **Run it:** `npm install && npm run dev` (port 8080). No env needed.
2. **Verify the math:** run the golden-values self-check (README / core spec §3.5).
3. **Deploy:** static SPA on Vercel (preset Vite, output `dist/`) or any static
   host; add the SPA rewrite `/* → /index.html`. Public — no auth.
4. **Embed on adfixus.com:** drop the iframe + `message` snippet from the core spec
   (§5) onto the page; it auto-resizes.
5. **(Optional) leads:** to send leads somewhere other than `localStorage`,
   implement `LeadAdapter` and call `setLeadAdapter()` once at startup.

## Ideas for development

- Shareable result permalinks (encode inputs in the URL) for sales follow-up.
- "Compare scenarios" side-by-side; A/B-tested headlines; light analytics events.
- A "see the CAPI story too" CTA that hands off to the capi-calculator (the engine
  already computes both under `id-capi`).
- Promote `src/core/` to a private npm package shared by all three repos (today
  it's vendored identically — see core spec §7).
