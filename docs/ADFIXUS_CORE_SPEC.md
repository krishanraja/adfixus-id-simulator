# AdFixus Core - Engine, Design System & Embed Spec

**Single source of truth for the calculation engine (math + assumptions), the
`AssumptionOverrides` surface, the design system, and the iframe-embedding
protocol used by the ID Durability Simulator.** Read this after
[README.md](../README.md) when you need the internals.

The engine (`src/core/`) is a self-contained, verified calculation core. This tool
drives it with **`scope: 'id-only'`** and renders the **ID Infrastructure** benefit
slice (Safari addressability recovery + CPM delta + CDP savings). The engine also
models CAPI and Media Performance benefit stacks and a pricing rate card; those
code paths exist inside the core but are **not surfaced by this tool**, treat them
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
    scenarioPresets.ts            # tool-local Scenario-tab presets (opportunity + rollout) + copy; NOT engine math
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
constant objects. So the sliders stay truthful, `useIdSimulator` snapshots the
pristine defaults, applies the user's values around each `calculate()` call, and
restores them in a `finally`, see the comments in that file. **Safari share is the
one control sourced per-property:** the engine reads the global `SAFARI_SHARE`, so
`useIdSimulator` sets it to the **pageview-weighted average of every domain's
`safariShare`** - making the Configure "Safari / iOS share" control the single
source of truth that drives the addressability recovery (there is no separate
global Safari slider).

### 1.2 The `AssumptionOverrides` surface

The 4th argument lets the UI override defaults without editing the core. It is a
partial, deep-mergeable object (see `types/scenarios.ts`) covering:

- **`readinessFactors`**: 8 business-readiness factors (7 are 0-1, plus `technicalDeploymentMonths`, a months value) that modulate
  risk-scenario efficiency. The engine still consumes them, but this tool no longer
  surfaces them as controls - a rollout sends `{}` (pure backbone).
- **`targetSafariAddressability` / `cpmUpliftFactor`**: the two first-class
  ID-infrastructure levers, set by the console's Opportunity scenario (below), and
  the only ID-infrastructure overrides the engine reads here. Baseline
  addressability, contextual-CPM ratio and CDP savings are applied through the
  mutable-constant injection in §1.1, not this object.
- The type also declares CAPI and Media-Performance fields (`capiServiceFee`,
  `capiMatchRate`, `capiYearlyCampaigns`, `capiAvgCampaignSpend`,
  `capiLineItemShare`, `premiumInventoryShare`, `premiumYieldUplift`) and three
  unused ID-infra fields (`safariBaselineAddressability`, `safariWithDurableId`,
  `cdpCostReduction`). These are engine-internal and not set by this tool's id-only
  path.

**The Scenario pickers → overrides.** The console's Scenario tab asks a publisher
only what they can reason about - two situation pickers, no raw dials - whose
presets live in `constants/scenarioPresets.ts` (tool-local product data, kept out
of the shared engine so the core stays identical across AdFixus tools). Each picker
shows a read-only "what we assumed" line built from the preset numbers
(`opportunityAssumption` / `rolloutAssumption`), so the copy can't drift from the math:

- *How far to push* (`OPPORTUNITY_PRESETS`, Cautious / Balanced / Ambitious) sets
  `targetSafariAddressability` (the recovered fraction of the Apple slice: 0.70 / 0.85
  / 0.95) + `cpmUpliftFactor` - the two upside assumptions only AdFixus can benchmark.
  First paint seeds the **Balanced** preset (0.85), which is the golden baseline.
- *How to roll out* (`ROLLOUT_PRESETS`, Lean / Backed / Strategic) selects the `risk`
  backbone (`conservative / moderate / optimistic`) and **clears `readinessFactors`
  to `{}`** - the estimate is the pure backbone. `NEUTRAL_READINESS` documents the
  per-factor value that gives a ×1.0 multiplier (the neutral point), retained for
  reference now that the readiness dials are no longer shown.

---

## 2. Formulas & assumptions

The engine models stacked benefit categories. Each is computed at "base", then
multiplied by (a) risk-scenario efficiency factors, then (b) the adoption rate,
then (c) a deployment multiplier. Totals are the sum of adopted components. **This
tool renders only §2.1 (ID Infrastructure);** §2.2-§2.3 are documented for
completeness.

### 2.1 ID Infrastructure (this tool)
- Impressions = `pageviews × adsPerPage`; split display/video by `displayVideoSplit`.
- Current revenue = `(displayImpr/1000)×displayCPM + (videoImpr/1000)×videoCPM`.
- **Apple/Safari addressability recovery:** newly-addressable Apple impressions =
  `impressions × AppleShare(default 0.35) × recovery`, where
  `recovery = targetSafariAddressability` (Balanced 0.85; the recovered fraction of the
  dark Apple slice - near-full because a durable, owned ID re-recognises returning
  Apple/Safari users past the 7-day ITP window).
- **CPM uplift is a delta, not the full CPM.** Newly-addressable Safari inventory
  today earns *contextual* CPM (`CONTEXTUAL_CPM_RATIO = 0.72` of addressable). The
  uplift is `addressableCPM − contextualCPM` where
  `addressableCPM = CPM × (1 + CPM_IMPROVEMENT_FACTOR 0.25)`.
- **CDP savings:** fixed `CDP_MONTHLY_SAVINGS = $3,500/mo` (configurable).
- **Total addressability = the story.** "Addressable today" is the non-Apple audience
  you still recognise once cookies expire, so the tool sets
  `BASELINE_TOTAL_ADDRESSABILITY = 1 − AppleShare` (per-render override in
  `useIdSimulator`, reproducing 65% at the default 35% Apple share). "With AdFixus" =
  `1 − AppleShare×(1 − recovery)`, which is **always ≤ 100%** (self-clamping) and rises
  to ~89 / 95 / 98% at the Cautious / Balanced / Ambitious recovery levels. The Apple
  slider moves both endpoints. The revenue path reads only the recovered slice
  (`AppleShare × recovery`), never the baseline, so this display reframe leaves the
  dollars unchanged.
- **Capability vs realisation.** The addressability % is the recognition *capability*
  (un-discounted); the dollars are that capability's revenue *realised at the chosen
  rollout* (`addressabilityEfficiency × cpmUpliftRealization × adoptionRate` ≈ 0.49 at
  moderate). Opportunity sets the ceiling; rollout sets realisation.
  `deriveAudienceVisibility()` exposes both (`addressableWithAdfixus`, plus
  `grossRecovery` / `realizedRecovery` / `realizedFraction`) so the Breakdown can show
  the recovered slice → impressions → full-potential $ → realised $ as one legible
  chain - no bald "Safari is 0% addressable today" absolute anywhere.

### 2.2 CAPI Capabilities (`id-capi`+, engine-internal)
- Match rate improves `BASELINE_MATCH_RATE 30% → IMPROVED_MATCH_RATE 75%`.
- Campaign volume is an **output** of Business Readiness:
  `BASE_YEARLY_CAMPAIGNS 12 × volumeMultiplier` (bounded 0.7-1.4×),
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

**Ramp length.** `generateMonthlyProjection` shapes the 12-month curve from
`rampUpMonths` - the risk backbone (conservative 12 / moderate 9 / optimistic 6),
i.e. the rollout the publisher picked. (The engine still honours a
`readinessFactors.technicalDeploymentMonths` override if one is supplied, but this
tool no longer surfaces that as a control.) Ramp length shapes only the monthly
curve - it never changes the annual total.

### 2.5 Golden values (regression guard)
For inputs `{5,000,000 pageviews, $4.50 display / $12 video CPM, 3.2 ads/page,
80% display, 35% Apple share}`, moderate risk, `scope: 'id-only'` - i.e. the
console's default **Balanced · Backed** scenario (recovery 0.85) with no readiness
overrides:

| Metric | Value |
|--------|-------|
| Current monthly revenue | **$96,000** |
| ID-only monthly uplift | **$9,679** |
| Total addressability (today → with AdFixus) | **65% → 94.75%** |
| CDP monthly savings (raw / displayed) | **$3,500** |

Recovery revenue is a *capability realised at the rollout*: full-potential recovery
≈ **$15,137/mo**, realised at Backed (`addressabilityEfficiency × cpmUpliftRealization
× adoptionRate` ≈ 0.492) ≈ **$7,447/mo**; plus CDP (realised ≈ $2,231) = **$9,679/mo**.
The two scenario pickers are strictly monotonic on the monthly uplift: opportunity
**$7,207 / $9,679 / $12,125** (Cautious / Balanced / Ambitious; total addressability
89.5 / 94.75 / 98.25%), rollout **$7,192 / $9,679 / $11,493** (Lean / Backed /
Strategic; addressability holds at 94.75% - capability vs realisation). If you touch
`benchmarks.ts`, `riskScenarios.ts`, or `scenarioPresets.ts`, re-check these before
shipping.

---

## 3. Design system

Dark theme, AdFixus bright-cyan accent. Defined as HSL tokens in `src/index.css`
(`:root`) with a matching `tailwind.config.ts`.

Key tokens: `--background: 0 0% 0%` (black), `--foreground: 0 0% 100%`,
`--primary: 195 95% 50%` (cyan), `--primary-glow: 195 95% 60%`, `--radius: 1rem`,
`--card: 0 0% 6%`, semantic `--success / --warning / --error`, status
`--revenue-gain / --revenue-loss`. Body font: **Montserrat** (loaded via a Google
Fonts `<link>` in `index.html`). Utility classes: `.glass-card`, `.gradient-text`,
`.btn-gradient`, `.hero-gradient`, `.shimmer`, `.animate-fade-in`, plus the
no-scroll layout helpers `.min-h-dvh-safe` and `.h-dvh-safe` (bounded
dynamic-viewport height) and `.scroll-contained` (thin, contained scrollbar) that
the full-picture console relies on.

> Note: adfixus.com is currently a *light* site. The dark-cyan look is canonical
> for this tool. If seamless blending into the live site becomes the priority, flip
> the token values in `src/index.css` (one file) to a light variant, nothing else
> needs to change.

---

## 4. Iframe embedding protocol

The app calls `initAdfixusEmbed({ appName })` in `src/main.tsx`. The module
(`src/core/embed/embed.ts`) reports content height to the parent via `postMessage`
so the parent iframe resizes to fit (no host-page scrollbar - the bounded
full-picture console keeps any internal overflow in thin, contained scrollbars of
its own). It validates the parent
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
open, and the drawer renders in normal document flow - bounded to a single
viewport (`h-dvh-safe` + `overflow-hidden`) rather than growing with its content -
`#root` scrollHeight always reflects what the visitor sees. Opening the full
picture therefore reports exactly one viewport (never a taller host page), and the
reported height stays correct as the visitor moves between the flow and the full
picture.

---

## 5. Domain intelligence (`src/core/intel/`)

The guided flow opens by asking for the visitor's website and tailoring the audit
to it. This layer is **pure data + functions, fully client-side** - it never calls
a backend of ours. It sits alongside the engine but is independent of the math.

```
src/core/intel/
  verticals.ts       # 7 vertical archetypes: input seeds + 4-part narrative + role proof
  knownDomains.ts    # AUTO-GENERATED: 130 companies / 239 domains from the research sheet
  resolveDomain.ts   # normalise → known-domain → keyword heuristics → generic fallback
  logo.ts            # ordered logo/favicon URL candidates for a domain
  index.ts           # @/core/intel barrel
```

### 5.1 Resolution

`resolveDomainProfile(input)` returns a `DomainProfile` and never throws:

1. **Normalise** - strip scheme/path/`www.`/port, lower-case, reduce to the
   registrable domain (handles multi-label SLDs like `co.uk`, `com.au`). Junk input
   (no dot, spaces, `@`) yields `emptyProfile()` - a generic open-web publisher.
2. **Known account** - exact registrable-domain match against `DOMAIN_TO_COMPANY`
   → the real company, vertical, anon share, Tranco rank, stack sophistication, and
   the verbatim identity-gap / hook from the research sheet (`match: 'known'`).
3. **Heuristic** - keyword patterns on the domain infer a vertical (`match:
   'heuristic'`).
4. **Fallback** - the default `news` archetype (`match: 'default'`).

### 5.2 Vertical archetypes (`verticals.ts`)

The seven verticals - `news`, `broadcast`, `lifestyle`, `entertainment`, `b2b`,
`classifieds`, `localnews` - each carry:

- **`seeds`** - directional open-web benchmarks (Safari share, display/video split,
  display/video CPM, ads/page, anon %, typical pageviews) applied to the simulator
  by `GuidedFlow.applyProfile()` so the model is pre-filled, then freely adjustable.
- **The four-part narrative** - `context` (hook grounded in their world) →
  `identityGap` (the wedge) → `whatItCosts` → `adfixusMapping` - mirroring the
  AdFixus account-research "final prompt" output structure.
- **`proof`** - a `Revenue` / `Ad-ops` / `Data` proof metric (`stat`, `statLabel`,
  `benchmark`, `source`). **These are published AdFixus benchmarks only** (e.g.
  Carsales +25% revenue; a broadcaster surfacing 600k Safari users in six weeks;
  100% first-party match with zero PII). No company-specific numbers are invented.

`TailoredBriefing` renders this - a trimmed teaser on the Reveal screen (the
identity gap plus the stakeholder proof metric; hidden on narrow screens, where
it's one tap away in the Briefing tab) and the full four-part briefing in the
full-picture console's Briefing tab (shown only when a domain was recognised) -
with a stakeholder-lens toggle that swaps the proof metric.

### 5.3 Regenerating `knownDomains.ts`

`knownDomains.ts` is generated from the AdFixus account-research spreadsheet
("Company Scores" tab), not hand-maintained. It is a DRY structure - a
`KNOWN_COMPANIES` array plus a `DOMAIN_TO_COMPANY` index (flagship + portfolio
domains → company). All facts derive from public BuiltWith / People Data Labs
research. Regenerate from the sheet rather than editing entries by hand.

### 5.4 Logos (`logo.ts` + `BrandLogo`)

`logoCandidates(domain)` returns an ordered URL list - the Brandfetch Logo CDN
(only when `VITE_BRANDFETCH_CLIENT_ID` is set) then public favicon services
(DuckDuckGo, Google). `BrandLogo` renders them via `<img>` and walks the list on
each error, ending on a neutral globe. Per Brandfetch's hotlinking policy these
URLs are for direct browser rendering; nothing is fetched or stored server-side,
so the tool stays 100% client-side with or without a client id.

## 6. Client-side outputs

- **PDF**: `src/utils/idPdf.ts` generates a proposal PDF fully client-side with
  pdfmake (lazy-loaded so it doesn't weigh down first paint). Nothing is emailed or
  sent anywhere.
- **Booking CTA**: links out to `VITE_MEETING_BOOKING_URL`.

There is no lead capture, database, or backend in this tool. The only network
egress is the visitor following the booking link.
