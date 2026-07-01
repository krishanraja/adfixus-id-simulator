# AdFixus Core — Canonical Specification

**This file is the single source of truth for the shared design system, the
calculation engine (math + assumptions), the iframe-embedding protocol, and the
pluggable adapters used across all three AdFixus tools.** It is vendored,
identical, into each repo at `docs/ADFIXUS_CORE_SPEC.md`. If you change the core,
change it here and re-sync `src/core/` into every repo (see § Keeping repos in sync).

> Provenance: the engine and assumptions were extracted and generalized from the
> now-retired **vox-adfixus** repo, which was the most mathematically robust of
> the original four. All Vox-Media-specific data (real domains, that customer's
> negotiated pricing, that customer's December-2024 browser shares) was removed
> and replaced with generic, configurable defaults.

---

## 1. The three tools

| Repo | Audience | Purpose | Engine scope |
|------|----------|---------|--------------|
| **adfixus-id-simulator** | Public lead magnet | Measure **ID durability** benefits for an open-web publisher | `id-only` |
| **adfixus-capi-calculator** | Public lead magnet | Measure **CAPI (Conversions API)** benefits on top of the ID | `id-capi` (present the CAPI slice) |
| **adfixus-sales** | Internal | Pull intelligence on a target business and build a **full proposal** | `id-capi-performance` (+ commercial modelling) |

All three are React 18 + Vite + TypeScript + Tailwind + shadcn/ui. All three are
**100% client-side** — no Supabase, no backend, no login, no secrets. All three
are **iframe-embeddable into adfixus.com**.

---

## 2. The AdFixus core (`src/core/`)

Vendored identically into each repo. Import via the `@/core/...` alias.

```
src/core/
  design/  … (tokens live in the repo's src/index.css + tailwind.config.ts — see §4)
  engine/
    unifiedCalculationEngine.ts   # the ROI engine
    domainAggregation.ts          # aggregate 1..N domains, weighted by pageviews
    index.ts                      # public API + convenience wrappers
  constants/
    benchmarks.ts                 # industry benchmarks (addressability, CAPI, media, operational)
    riskScenarios.ts              # conservative / moderate / optimistic multipliers
    readinessFactors.ts           # 8 business-readiness factors + presets
    pricingConfig.ts              # editable AdFixus rate card (SALES ONLY — never in a lead magnet)
  types/
    domain.ts                     # CoreDomain + singleDomain() helper
    scenarios.ts                  # inputs/results/scenario types
  embed/embed.ts                  # iframe height-reporting module
  adapters/leadAdapter.ts         # pluggable lead capture (localStorage default)
  selfcheck.ts                    # dependency-free golden-values test
```

### Consuming the engine

Lead magnets — one call, benefits only, no pricing:

```ts
import { calculateIdDurability, calculateCapiBenefits } from '@/core/engine';

const r = calculateIdDurability({
  monthlyPageviews: 5_000_000,
  displayCPM: 4.5, videoCPM: 12,
  adsPerPage: 3.2, displayVideoSplit: 80, safariShare: 0.35,
});
r.idInfrastructure.monthlyUplift; // → the headline ID-durability number
```

Sales — full stack + editable pricing:

```ts
import { UnifiedCalculationEngine, singleDomain, DEFAULT_PRICING } from '@/core/engine';

const results = UnifiedCalculationEngine.calculate(
  { domains: [singleDomain({ monthlyPageviews: 5_000_000 })], displayCPM: 4.5, videoCPM: 12, capiLineItemShare: 0.6 },
  { deployment: 'single', scope: 'id-capi-performance' },
  'moderate',                       // risk scenario
  undefined,                        // AssumptionOverrides (readiness sliders, etc.)
  { ...DEFAULT_PRICING, contractDiscountPercent: 10 }, // editable pricing — every field is a slider
);
```

`scope` selects the benefit stack: `id-only` → ID Infrastructure only; `id-capi`
→ + CAPI Capabilities; `id-capi-performance` → + Media Performance.

---

## 3. Formulas & assumptions

The engine models three stacked benefit categories. Each is computed at "base",
then multiplied by (a) risk-scenario efficiency factors, then (b) the adoption
rate, then (c) a deployment multiplier. Totals are the sum of adopted components.

### 3.1 ID Infrastructure (always included)
- Impressions = `pageviews × adsPerPage`; split display/video by `displayVideoSplit`.
- Current revenue = `(displayImpr/1000)×displayCPM + (videoImpr/1000)×videoCPM`.
- **Safari addressability recovery:** newly-addressable Safari impressions =
  `impressions × SAFARI_SHARE(0.35) × safariAddressabilityImprovement`
  where improvement = `targetSafariAddressability(default 0.35) − 0`.
- **CPM uplift is a delta, not the full CPM.** Newly-addressable Safari inventory
  today earns *contextual* CPM (`CONTEXTUAL_CPM_RATIO = 0.72` of addressable). The
  uplift is `addressableCPM − contextualCPM` where `addressableCPM = CPM × (1 + CPM_IMPROVEMENT_FACTOR 0.25)`.
- **CDP savings:** fixed `CDP_MONTHLY_SAVINGS = $3,500/mo` (configurable).
- Total addressability moves from `BASELINE_TOTAL_ADDRESSABILITY = 65%` to `65% + SAFARI_SHARE×improvement` (≈72–77%).

### 3.2 CAPI Capabilities (`id-capi`, `id-capi-performance`)
- Match rate improves `BASELINE_MATCH_RATE 30% → IMPROVED_MATCH_RATE 75%`.
- Campaign volume is an **output** of Business Readiness, not a manual input:
  `BASE_YEARLY_CAMPAIGNS 12 × volumeMultiplier` (bounded 0.7–1.4×), `BASE_AVG_CAMPAIGN_SPEND $75K × spendMultiplier` (≤1.15×), distributed across 12 months (POC-then-scale).
- CAPI-eligible spend = `monthlyCampaignSpend × capiLineItemShare`.
- Conversion uplift = `CONVERSION_RATE_MULTIPLIER 1.40 − 1` (i.e. +40%).
- Net publisher benefit = `conversionTrackingRevenue + labourSavings − serviceFees`,
  where labour savings = `40 hrs × $75`, service fee = `improvedEligibleSpend × capiServiceFeeRate (0.125)`.

### 3.3 Media Performance (`id-capi-performance` only)
- Premium yield = `premiumImpressions(PREMIUM_INVENTORY_SHARE 0.20) × CPM × YIELD_UPLIFT 0.15`.
- Make-good savings = `directSold(0.40 of revenue) × (BASELINE_MAKEGOOD 0.05 − IMPROVED_MAKEGOOD 0.02)`.
- ROAS improves `2.5 → 3.5` (reporting only).

### 3.4 Risk scenarios (efficiency + adoption)
`conservative / moderate / optimistic` scale ramp-up months, adoption rate,
addressability efficiency, CAPI deployment rate, CPM-uplift realization, sales
effectiveness, and CDP-savings realization. See `constants/riskScenarios.ts` for
exact values. Readiness factors (`constants/readinessFactors.ts`, 8 sliders) further
modulate these and drive CAPI campaign volume.

### 3.5 Golden values (regression guard)
For inputs `{5,000,000 pageviews, $4.50 display / $12 video CPM, 3.2 ads/page, 80% display, 35% Safari}`, moderate risk:

| Metric | Value |
|--------|-------|
| Current monthly revenue | **$96,000** |
| ID-only monthly uplift | **$5,298** |
| Improved addressability | **77.3%** |
| CDP monthly savings | **$3,500** |
| CAPI monthly uplift (id-capi) | **$6,488** |

Run the check in any repo:
```bash
npx esbuild src/core/selfcheck.ts --bundle --platform=node --format=cjs \
  --outfile=/tmp/afx.cjs && node /tmp/afx.cjs
```
It exits non-zero if any value drifts. Because `src/core/` is byte-identical in
every repo, all three produce identical numbers by construction.

---

## 4. Design system (canonical)

Dark theme, AdFixus bright-cyan accent. Defined as HSL tokens in each repo's
`src/index.css` (`:root`) with a matching `tailwind.config.ts`. Both files are
**identical across the three repos** — copy, don't diverge.

Key tokens: `--background: 0 0% 0%` (black), `--foreground: 0 0% 100%`,
`--primary: 195 95% 50%` (cyan), `--primary-glow: 195 95% 60%`, `--radius: 1rem`,
`--card: 0 0% 6%`, semantic `--success / --warning / --error`, status
`--revenue-gain / --revenue-loss`. Body font: **Montserrat** (loaded via Google
Fonts `<link>` in `index.html`). Utility classes: `.glass-card`, `.gradient-text`,
`.btn-gradient`, `.hero-gradient`, `.shimmer`, `.animate-fade-in`, `.scanner-card`.

> Note: adfixus.com is currently a *light* site. The user chose the dark-cyan look
> as canonical. If seamless blending into the live site becomes the priority, flip
> the token values in `src/index.css` (one file) to a light variant — nothing else
> needs to change.

---

## 5. Iframe embedding

Every tool calls `initAdfixusEmbed({ appName })` in `src/main.tsx`. The module
(`src/core/embed/embed.ts`) reports content height to the parent via `postMessage`
so the parent iframe resizes to fit (no inner scrollbar). It validates the parent
origin (default `https://www.adfixus.com`), throttles with a `ResizeObserver`,
guards against feedback loops, and answers `ping`/`requestHeight` messages.

**Parent-page snippet (put on adfixus.com):**
```html
<iframe id="afx" src="https://YOUR-HOST/" style="width:100%;border:0;" scrolling="no"></iframe>
<script>
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://YOUR-HOST') return;
    if (e.data?.type === 'setHeight') document.getElementById('afx').style.height = e.data.height + 'px';
  });
</script>
```
To embed on a domain other than adfixus.com, pass `parentOrigin` to
`initAdfixusEmbed`.

---

## 6. Adapters (client-side, pluggable)

Because there is no backend, side-effects are behind adapters that default to safe
client-side behaviour:

- **Lead capture** (`src/core/adapters/leadAdapter.ts`): default appends the lead
  to `localStorage["adfixus_leads"]`. To send leads to a CRM/ESP later, implement
  the `LeadAdapter` interface and call `setLeadAdapter(yours)` once at startup —
  nothing else changes.
- **PDF**: generated fully client-side with pdfmake and downloaded. No email.
- **Sales scanner**: runs on bundled `src/data/sampleScans.json` + manual input,
  with deterministic client-side insights. Live third-party domain scanning is not
  possible from a browser (CORS/headless); a future owner can implement a
  `scanProvider` against their own service.

---

## 7. Keeping repos in sync

`src/core/`, `src/index.css`, and `tailwind.config.ts` must stay **identical**
across the three repos. When you change one, copy it to the others and run the
self-check in each. There is deliberately no shared npm package (kept simple for
handover); promoting the core to a private package is a good future step.
