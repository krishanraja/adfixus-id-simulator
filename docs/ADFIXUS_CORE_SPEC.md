# AdFixus Core — Canonical Specification

**This file is the single source of truth for the shared design system, the
calculation engine (math + assumptions), the `AssumptionOverrides` surface, and
the iframe-embedding protocol used across all three AdFixus tools.** It is
vendored, byte-identical, into each repo at `docs/ADFIXUS_CORE_SPEC.md`. If you
change the core, change it here and re-sync `src/core/` into every repo (see
§7 Keeping repos in sync).

---

## 1. The three tools (which one draws which slice)

| Repo | Audience | Purpose | Engine scope | Draws |
|------|----------|---------|--------------|-------|
| **adfixus-id-simulator** | Public lead magnet | Measure **ID durability** for an open-web publisher | `id-only` | `results.idInfrastructure` (Safari addressability recovery + CPM delta + CDP savings) |
| **adfixus-capi-calculator** | Public lead magnet | Measure the **CAPI Sales-Plan** — campaign ramp + $30K-cap economics + deal models | `id-capi` | `results.capiCapabilities` + the commercial deal models (revenue-share / annual-cap / flat-fee) |
| **adfixus-sales** | Internal (team-only) | **Target Business Report Card** — live enrichment + v6 rubric + full ROI/commercial | `id-capi-performance` | the full stack + `pricingConfig` + commercial modelling |

All three are React 18 + Vite + TypeScript + Tailwind + shadcn/ui and all three
are **iframe-embeddable into adfixus.com**.

- The **two lead magnets are 100% client-side** — no backend, no login, no
  secrets. They import `src/core` and render benefit slices only; they never
  import `pricingConfig`.
- **adfixus-sales has a serverless backend** (Vercel `api/*`) that holds all the
  third-party enrichment keys server-side and is reached through
  `src/lib/proxyClient.ts`. It is **team-only**, served behind Vercel
  authentication on `adfixus-sales.vercel.app`; confidential data lives only
  behind the proxy, never in the client bundle or the repo. See **docs/PROXY.md**
  (adfixus-sales only) for the endpoint + env-var runbook.

---

## 2. The AdFixus core (`src/core/`)

Vendored identically into each repo. Import via the `@/core` alias.

```
src/core/
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
    scenarios.ts                  # inputs / results / scenario / AssumptionOverrides types
  embed/embed.ts                  # iframe height-reporting module
  adapters/leadAdapter.ts         # pluggable lead capture (localStorage default)
  selfcheck.ts                    # dependency-free golden-values test
  index.ts                        # re-exports everything above
```

### 2.1 Engine API

**Convenience wrappers (lead magnets)** — benefits only, no pricing, from a
handful of simple inputs (`SimpleSiteInputs`):

```ts
import { calculateIdDurability, calculateCapiBenefits } from '@/core';

// id-simulator (scope 'id-only'): read result.idInfrastructure
const id = calculateIdDurability({
  monthlyPageviews: 5_000_000,
  displayCPM: 4.5, videoCPM: 12,
  adsPerPage: 3.2, displayVideoSplit: 80, safariShare: 0.35,
});
id.idInfrastructure.monthlyUplift; // headline ID-durability number

// capi-calculator (scope 'id-capi'): read result.capiCapabilities
const capi = calculateCapiBenefits({ monthlyPageviews: 5_000_000, capiLineItemShare: 0.6 });
capi.capiCapabilities.conversionTrackingRevenue; // CAPI incremental revenue
```

Both wrappers accept an optional second arg `{ deployment?, risk?, overrides? }`.

**Full engine (sales)** — the one call everything else is built on:

```ts
import { UnifiedCalculationEngine, singleDomain, DEFAULT_PRICING } from '@/core';

const results = UnifiedCalculationEngine.calculate(
  inputs,      // { domains: CoreDomain[], displayCPM, videoCPM, capiLineItemShare, ... }
  scenario,    // { deployment: 'single' | 'portfolio', scope: 'id-only' | 'id-capi' | 'id-capi-performance' }
  risk,        // 'conservative' | 'moderate' | 'optimistic'
  overrides,   // AssumptionOverrides | undefined  (readiness sliders + benchmark/pricing overrides)
  pricing,     // PricingConfig | undefined  (sales only; every field is a UI slider)
);
```

Signature:
`UnifiedCalculationEngine.calculate(inputs, scenario, risk, overrides?, pricing?) → UnifiedResults`

`scope` selects the benefit stack:
- `id-only` → **ID Infrastructure** only.
- `id-capi` → + **CAPI Capabilities**.
- `id-capi-performance` → + **Media Performance**.

`UnifiedCalculationEngine.generateMonthlyProjection(results)` returns the
month-by-month ramp used by the charts.

### 2.2 The `AssumptionOverrides` surface

The 4th argument lets any tool override defaults without editing the core. It is
a partial, deep-mergeable object (see `types/scenarios.ts`) covering:

- **`readinessFactors`** — the 8 business-readiness sliders (0–1 each). These
  modulate risk-scenario efficiency and, for CAPI, drive campaign volume/spend
  multipliers. Presets live in `constants/readinessFactors.ts`.
- **`benchmarks`** — override any industry-benchmark constant (addressability,
  CAPI, media, operational) from `constants/benchmarks.ts`.
- **`adoptionRate` / `rampMonths`** — override the risk-scenario adoption curve.

Pricing is **not** part of `AssumptionOverrides`; it is the separate 5th argument
`PricingConfig` and is used only by the sales tool.

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
  `BASE_YEARLY_CAMPAIGNS 12 × volumeMultiplier` (bounded 0.7–1.4×), `BASE_AVG_CAMPAIGN_SPEND $75K × spendMultiplier` (≤1.15×), distributed across 12 months (POC-then-scale campaign ramp).
- CAPI-eligible spend = `monthlyCampaignSpend × capiLineItemShare`.
- Conversion uplift = `CONVERSION_RATE_MULTIPLIER 1.40 − 1` (i.e. +40%).
- Net publisher benefit = `conversionTrackingRevenue + labourSavings − serviceFees`,
  where labour savings = `40 hrs × $75`, service fee = `improvedEligibleSpend × capiServiceFeeRate (0.125)`.
- **Deal-model economics (capi-calculator + sales):** the 12.5% share applies to
  **CAPI incremental revenue only**, with a **$30K/campaign monthly cap**
  (`capiCampaignCapMonthly`). Three publisher deal models are compared —
  **revenue-share** (12.5% uncapped, recommended, fully aligned), **annual-cap**
  (12.5% with a Year-1 cap, then unlimited publisher upside), and **flat-fee**
  (fixed annual fee, no growth alignment).

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
`.btn-gradient`, `.hero-gradient`, `.shimmer`, `.animate-fade-in`.

> Note: adfixus.com is currently a *light* site. The dark-cyan look is canonical.
> If seamless blending into the live site becomes the priority, flip the token
> values in `src/index.css` (one file) to a light variant — nothing else needs to
> change.

---

## 5. Iframe embedding protocol

Every tool calls `initAdfixusEmbed({ appName })` in `src/main.tsx`. The module
(`src/core/embed/embed.ts`) reports content height to the parent via `postMessage`
so the parent iframe resizes to fit (no inner scrollbar). It validates the parent
origin (default `https://www.adfixus.com`), throttles with a `ResizeObserver`,
guards against feedback loops (only sends when height changes >10px, capped at
`maxHeight` 5000px), and answers `ping` (→ `pong`) and `requestHeight` messages.

**Child → parent message:** `{ type: 'setHeight', height: <px>, source: <appName>, trigger }`.

**Parent-page snippet (put on adfixus.com):**
```html
<iframe id="afx" src="https://YOUR-HOST/" style="width:100%;border:0;" scrolling="no"></iframe>
<script>
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://YOUR-HOST') return;
    if (e.data?.type === 'setHeight') {
      document.getElementById('afx').style.height = e.data.height + 'px';
    }
  });
  // Optional: ask the child to (re)report its height after your layout settles.
  // document.getElementById('afx').contentWindow.postMessage({ type: 'requestHeight' }, 'https://YOUR-HOST');
</script>
```
`initAdfixusEmbed` defaults `parentOrigin` to `https://www.adfixus.com`. To embed
on another origin, pass `initAdfixusEmbed({ appName, parentOrigin })`.

---

## 6. Adapters (pluggable)

- **Lead capture** (`src/core/adapters/leadAdapter.ts`): default appends the lead
  to `localStorage["adfixus_leads"]`. To send leads to a CRM/ESP later, implement
  the `LeadAdapter` interface and call `setLeadAdapter(yours)` once at startup —
  nothing else changes. In **adfixus-sales** the lead can also be POSTed to the
  proxy `POST /api/lead` (Resend), server-side.
- **PDF**: generated fully client-side with pdfmake and downloaded. No email in
  the lead magnets.

---

## 7. Keeping repos in sync

`src/core/`, `src/index.css`, `tailwind.config.ts`, and this
`docs/ADFIXUS_CORE_SPEC.md` must stay **identical** across the three repos. When
you change one, copy it to the others and run the self-check in each. There is
deliberately no shared npm package (kept simple for handover); promoting the core
to a private package is a good future step.
