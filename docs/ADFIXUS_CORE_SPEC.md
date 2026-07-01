# AdFixus Core — Engine, Design System & Embed Spec

**Single source of truth for the calculation engine (math + assumptions), the
`AssumptionOverrides` surface, the design system, and the iframe-embedding
protocol used by the ID Durability Simulator.** Read this after
[README.md](../README.md) when you need the internals.

The engine (`src/core/`) is a self-contained, verified calculation core. This tool
drives it with **`scope: 'id-only'`** and renders the **ID Infrastructure** benefit
slice (Safari addressability recovery + CPM delta + CDP savings). The engine also
models CAPI and Media Performance benefit stacks and a pricing rate card; those
code paths exist inside the core but are **not surfaced by this tool** — treat them
as engine internals you can ignore unless you extend the product.

---

## 1. The core (`src/core/`)

Import everything via the `@/core` alias.

```
src/core/
  engine/
    unifiedCalculationEngine.ts   # the ROI engine
    domainAggregation.ts          # aggregate 1..N domains, weighted by pageviews
    index.ts                      # public API (engine + constants + types)
  constants/
    benchmarks.ts                 # industry benchmarks (addressability, CAPI, media, operational)
    riskScenarios.ts              # conservative / moderate / optimistic multipliers
    readinessFactors.ts           # 8 business-readiness factors + presets
    pricingConfig.ts              # AdFixus rate card (engine-internal; unused by this tool's id-only scope)
  types/
    domain.ts                     # CoreDomain + singleDomain() helper
    scenarios.ts                  # inputs / results / scenario / AssumptionOverrides types
  embed/embed.ts                  # iframe height-reporting module
  index.ts                        # @/core public barrel (re-exports the engine)
```

### 1.1 How this tool calls the engine

The UI never does math. `src/hooks/useIdSimulator.ts` builds the inputs from state
and calls the engine directly:

```ts
import { UnifiedCalculationEngine, singleDomain } from '@/core';

const results = UnifiedCalculationEngine.calculate(
  { domains, displayCPM, videoCPM, capiLineItemShare: 0.6 },
  { deployment: 'single', scope: 'id-only' },   // this tool is always id-only
  risk,                                          // 'conservative' | 'moderate' | 'optimistic'
  overrides,                                     // AssumptionOverrides (readiness + benchmark overrides)
);

results.idInfrastructure;      // the ID-durability slice this tool renders
```

Signature:
`UnifiedCalculationEngine.calculate(inputs, scenario, risk, overrides?, pricing?) → UnifiedResults`

`scope` selects the benefit stack:
- `id-only` → **ID Infrastructure** only. ← this tool
- `id-capi` → + **CAPI Capabilities**.
- `id-capi-performance` → + **Media Performance**.

`UnifiedCalculationEngine.generateMonthlyProjection(results)` returns the
month-by-month ramp used by the charts.

**Live benchmark overrides.** A few benchmarks (Safari share, baseline
addressability, contextual-CPM ratio, CDP savings) are exported as mutable
constant objects. So the advanced sliders stay truthful, `useIdSimulator` snapshots
the pristine defaults, applies the user's values around each `calculate()` call,
and restores them in a `finally` — see the comments in that file.

### 1.2 The `AssumptionOverrides` surface

The 4th argument lets the UI override defaults without editing the core. It is a
partial, deep-mergeable object (see `types/scenarios.ts`) covering:

- **`readinessFactors`** — the 8 business-readiness sliders (0–1 each). These
  modulate risk-scenario efficiency. Presets live in `constants/readinessFactors.ts`.
- **`targetSafariAddressability` / `cpmUpliftFactor`** — the two first-class
  ID-infrastructure levers the advanced panel exposes.
- **`benchmarks`** — override any industry-benchmark constant from
  `constants/benchmarks.ts`.
- **`adoptionRate` / `rampMonths`** — override the risk-scenario adoption curve.

---

## 2. Formulas & assumptions

The engine models stacked benefit categories. Each is computed at "base", then
multiplied by (a) risk-scenario efficiency factors, then (b) the adoption rate,
then (c) a deployment multiplier. Totals are the sum of adopted components. **This
tool renders only §2.1 (ID Infrastructure);** §2.2–§2.3 are documented for
completeness.

### 2.1 ID Infrastructure (this tool)
- Impressions = `pageviews × adsPerPage`; split display/video by `displayVideoSplit`.
- Current revenue = `(displayImpr/1000)×displayCPM + (videoImpr/1000)×videoCPM`.
- **Safari addressability recovery:** newly-addressable Safari impressions =
  `impressions × SAFARI_SHARE(0.35) × safariAddressabilityImprovement`
  where improvement = `targetSafariAddressability(default 0.35) − 0`.
- **CPM uplift is a delta, not the full CPM.** Newly-addressable Safari inventory
  today earns *contextual* CPM (`CONTEXTUAL_CPM_RATIO = 0.72` of addressable). The
  uplift is `addressableCPM − contextualCPM` where
  `addressableCPM = CPM × (1 + CPM_IMPROVEMENT_FACTOR 0.25)`.
- **CDP savings:** fixed `CDP_MONTHLY_SAVINGS = $3,500/mo` (configurable).
- Total addressability moves from `BASELINE_TOTAL_ADDRESSABILITY = 65%` to
  `65% + SAFARI_SHARE×improvement` (≈72–77%).

The guided flow narrates this as an **audience-visibility story** (how much of the
audience is invisible today, how much a durable ID recovers). Those figures are
derived from the same engine result in `deriveAudienceVisibility()` — they are a
retelling of the model's addressability numbers, not new inputs.

### 2.2 CAPI Capabilities (`id-capi`+, engine-internal)
- Match rate improves `BASELINE_MATCH_RATE 30% → IMPROVED_MATCH_RATE 75%`.
- Campaign volume is an **output** of Business Readiness:
  `BASE_YEARLY_CAMPAIGNS 12 × volumeMultiplier` (bounded 0.7–1.4×),
  `BASE_AVG_CAMPAIGN_SPEND $75K × spendMultiplier` (≤1.15×), across 12 months.
- CAPI-eligible spend = `monthlyCampaignSpend × capiLineItemShare`.
- Conversion uplift = `CONVERSION_RATE_MULTIPLIER 1.40 − 1` (+40%).
- Net publisher benefit = `conversionTrackingRevenue + labourSavings − serviceFees`.

### 2.3 Media Performance (`id-capi-performance`, engine-internal)
- Premium yield = `premiumImpressions(0.20) × CPM × YIELD_UPLIFT 0.15`.
- Make-good savings = `directSold(0.40) × (BASELINE 0.05 − IMPROVED 0.02)`.

### 2.4 Risk scenarios (efficiency + adoption)
`conservative / moderate / optimistic` scale ramp-up months, adoption rate,
addressability efficiency, CPM-uplift realization, and CDP-savings realization.
Exact values in `constants/riskScenarios.ts`. The 8 readiness factors
(`constants/readinessFactors.ts`) further modulate these.

### 2.5 Golden values (regression guard)
For inputs `{5,000,000 pageviews, $4.50 display / $12 video CPM, 3.2 ads/page,
80% display, 35% Safari}`, moderate risk, `scope: 'id-only'`:

| Metric | Value |
|--------|-------|
| Current monthly revenue | **$96,000** |
| ID-only monthly uplift | **$5,298** |
| Improved addressability | **77.3%** |
| CDP monthly savings | **$3,500** |

If you touch `benchmarks.ts` or `riskScenarios.ts`, re-check these numbers against
a run of the app before shipping.

---

## 3. Design system

Dark theme, AdFixus bright-cyan accent. Defined as HSL tokens in `src/index.css`
(`:root`) with a matching `tailwind.config.ts`.

Key tokens: `--background: 0 0% 0%` (black), `--foreground: 0 0% 100%`,
`--primary: 195 95% 50%` (cyan), `--primary-glow: 195 95% 60%`, `--radius: 1rem`,
`--card: 0 0% 6%`, semantic `--success / --warning / --error`, status
`--revenue-gain / --revenue-loss`. Body font: **Montserrat** (loaded via a Google
Fonts `<link>` in `index.html`). Utility classes: `.glass-card`, `.gradient-text`,
`.btn-gradient`, `.hero-gradient`, `.shimmer`, `.animate-fade-in`.

> Note: adfixus.com is currently a *light* site. The dark-cyan look is canonical
> for this tool. If seamless blending into the live site becomes the priority, flip
> the token values in `src/index.css` (one file) to a light variant — nothing else
> needs to change.

---

## 4. Iframe embedding protocol

The app calls `initAdfixusEmbed({ appName })` in `src/main.tsx`. The module
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

Because the guided flow hides (rather than unmounts) while the depth drawer is
open, and the drawer renders in normal document flow, `#root` scrollHeight always
reflects what the visitor sees — so the reported height stays correct as the
visitor moves between the flow and the full picture.

---

## 5. Client-side outputs

- **PDF**: `src/utils/idPdf.ts` generates a proposal PDF fully client-side with
  pdfmake (lazy-loaded so it doesn't weigh down first paint). Nothing is emailed or
  sent anywhere.
- **Booking CTA**: links out to `VITE_MEETING_BOOKING_URL`.

There is no lead capture, database, or backend in this tool. The only network
egress is the visitor following the booking link.
