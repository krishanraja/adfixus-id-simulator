# Changelog

All notable changes to **adfixus-id-simulator**, the public AdFixus Identity
Durability Simulator lead magnet.

> **Current architecture (authoritative):** a 100% client-side React SPA. The
> default surface is an Apple-grade **guided flow** (`src/components/flow/*`:
> provocation → domain recognition → one audience-size control → animated reveal →
> a depth drawer holding the no-scroll full-picture console,
> `src/components/simulator/*`). The math
> lives in the verified **`src/core`** engine (`scope: 'id-only'`), driven by a
> single `src/hooks/useIdSimulator.ts` instance shared by the flow and the drawer.
> Iframe-embeddable into adfixus.com. **No backend, no login, no lead capture, no
> secrets.** Older entries below predate the current build; where they mention
> Supabase/edge functions or lead capture, that architecture is **retired**.

---

## [4.5.0] - Addressability reframe: 65% → ~95%, tied to ROI (current)

The Breakdown both looked wrong and undersold AdFixus: it asserted a hardcoded
"Safari addressability today: 0%", capped recovery at 45%, and showed a raw
addressability picture next to a silently risk-discounted dollar — so the two
seemed inconsistent. The real story is that a durable, owned ID makes the dark
Apple/Safari audience addressable, lifting **total** addressability from ~65% to
~95%, and the dollars follow from exactly that.

### Changed
- **The story is now total addressability.** "Addressable today" is the non-Apple
  audience you still recognise once cookies expire, so it is derived from the Apple
  share (`BASELINE_TOTAL_ADDRESSABILITY = 1 − AppleShare`, a per-render override in
  `useIdSimulator`). "With AdFixus" = `1 − AppleShare×(1 − recovery)` — **always
  ≤ 100%** (self-clamping), and the Apple slider now moves both endpoints truthfully.
  This is display-only: **the dollar totals are unchanged by it** (revenue reads only
  the recovered slice).
- **Recovery recalibrated to near-full.** `OPPORTUNITY_PRESETS.targetSafariAddressability`
  → `0.70 / 0.85 / 0.95` (Cautious / Balanced / Ambitious) → total addressability
  ~89 / 95 / 98% at the default 35% Apple share.
- **Bulletproof picture ↔ $.** The Breakdown adds a traceability strip — recovered
  slice → newly-addressable impressions → full-potential $ → realised-at-your-rollout
  $ — so "higher addressability → higher ROI" is legible, with the rollout discount
  shown, not hidden. Addressability is the capability; the dollars are what the rollout
  realises in year one. `deriveAudienceVisibility` now returns `addressableWithAdfixus`,
  `grossRecovery`, `realizedRecovery`, `realizedFraction`, `newlyAddressableImpressions`.
- **Rail** leads with **"Now addressable ~95%"** instead of "Dark audience recovered ~X%".

### Removed
- The dangerous **"Safari addressability today: 0%"** and capped "Safari with durable
  ID" stat cards (Breakdown) and the equivalent PDF row. No absolute Safari-zero claim
  anywhere. Dropped the now-unused `baselineAddressability` state field.

### Golden re-baselines (intended)
Balanced · Backed (5M pv, 3.2 ads, 35% Apple, moderate) →
**`$9,679/mo · $116,143/yr`**, total addressability **65% → 94.75%** (was
`$5,298/mo · 77.3%`). Full-potential recovery ≈ $15,137/mo, realised at Backed
(≈ 0.492) ≈ $7,447/mo, + CDP ≈ $2,231 = $9,679.

### Verified
- Golden + both ladders confirmed against the engine (numeric harness): opportunity
  `$7,207 / $9,679 / $12,125` (89.5 / 94.75 / 98.25%); rollout `$7,192 / $9,679 /
  $11,493` (addressability holds at 94.75% — capability vs realisation). Apple-share
  sweep 10→70%: "today" falls, "with AdFixus" never reaches 100%. Traceability strip's
  realised $ + CDP = the rail total. `tsc` / `lint` / `build` clean.

## [4.4.0] - Ruthless simplification: ask only what a publisher knows

The console still asked questions a Head of Revenue can't answer and that
overlapped each other ("Share matched to a known user today", "What an unmatched
impression still earns", four different Safari-adjacent inputs), and one of them
("Share matched…") didn't even move the headline. The tool now asks the handful of
things a revenue leader genuinely knows; everything else is an invisible benchmark
default or a pre-defined scenario.

### Changed
- **Configure is now two plain cards.** *Your audience* (`DomainPortfolio`) =
  monthly pageviews + one **"Your Apple audience (Safari & iOS)"** question, with
  the property name and multi-site controls tucked behind an optional "Run more than
  one site?" reveal. *What your ads earn* (`BasicInputs`) = average display/video CPM.
- **Fine-tune → renamed "Scenario", now pickers-only.** The two situation pickers
  (*How far do you want to push?* and *How will you roll it out?*) each show a
  read-only **"What we assumed"** line derived from the preset numbers
  (`opportunityAssumption` / `rolloutAssumption`) — no raw sliders.

### Removed (from the UI; defaults kept)
- The **"What you already know"** card — `baselineAddressability` (which only moved
  the Breakdown chart, never the headline), `contextualCpmRatio`, and the CDP-spend
  question. All three stay at their benchmark defaults, so the number is unchanged.
- **Ads-per-page** and **display/video split** controls — inferred from the vertical
  seed / default, not asked.
- **All 10 raw "Advanced" sliders** under the scenario pickers (2 upside + 8
  readiness + technical-deployment).
- Deleted the now-unreferenced `AssumptionSlider.tsx`; dropped the dead
  `patchReadiness` setter and `CDP_DEDUPE_SAVINGS_RATE` from `useIdSimulator`.

### Result
Down from ~14 inputs + 10 advanced sliders to **6 plain questions + 2 scenario
pickers, zero assumption sliders.**

### Verified
- Golden holds bit-exact at the regression config (5M pv, 3.2 ads/page, Balanced ·
  Backed) → monthly `$5,298`, improved addressability `77.3%`. The engine, `DEFAULTS`
  and all presets are untouched and every removed control keeps its default state
  field, so `computeResults` is unchanged.
- Every remaining visible input (audience, both CPMs, Apple share) moves the
  headline; both pickers strictly monotonic ($3,653/$5,298/$6,918 and
  $4,054/$5,298/$6,218); the "what we assumed" text matches the active preset; Reset
  restores Balanced · Backed; PDF downloads; no inner scroll at lg/xl. `tsc` / `lint`
  / `build` clean.

## [4.3.0] - Fine-tune reframed for the publisher persona; correctness cleanup

The tool's user is a publisher's **Head of Revenue / Ad Ops / Data**, not an
AdFixus insider. The Fine-tune tab used to ask them for internal benchmarks they
can't know ("Recovered Safari addressability", "CPM uplift factor") and double-
counted execution risk against the Configure risk toggle. It now speaks their
language: state the few facts you know, then pick the scenario that matches your
situation.

### Changed
- **Fine-tune is now scenario-led.** Two situation pickers replace the raw benchmark
  grid, each with the per-variable diligence cards one click away under **Advanced**:
  - *The opportunity* (**Cautious / Balanced / Ambitious**) sets the two upside
    assumptions only AdFixus can benchmark (`targetSafariAddressability`,
    `cpmUpliftFactor`).
  - *Your rollout* (**Lean / Backed / Strategic**) — genuine, empathetic publisher
    situations, not catchphrases — selects the realisation backbone (`risk`) and
    clears the readiness overrides so the estimate is the pure backbone.
- **The three facts a publisher actually knows moved to Configure** under a new
  **"What you already know"** card, in plain language: *share matched to a known
  user today*, *what an unmatched impression still earns*, and *monthly spend on
  your data platform / CDP* (which now derives the saving from the spend they know,
  showing "≈ $X/mo saved").
- **Removed the "How cautious should we be?" risk toggle** from Configure — the
  rollout picker owns that one concept now, so risk isn't asked in two places.
- **Reframed the assumption copy** throughout to publisher-plain wording ("How much
  Safari audience we win back", "Premium on impressions we make addressable again").

### Fixed
- **The "Technical deployment" control now actually moves the ramp.** It set a local
  variable `generateMonthlyProjection` never read; the projection now reads the
  `technicalDeploymentMonths` override (else the rollout's backbone: 12 / 9 / 6).
  Additive and ramp-only — it never changes the annual total.
- **Readiness dials no longer double-count.** A rollout sends no readiness override;
  the 8 cards display a calibrated **neutral** baseline (`NEUTRAL_READINESS`, ×1.0),
  so nudging one writes an honest deviation instead of silently lowering the number.
- **The PDF summary downloads reliably.** The `window.open` after an `await` ran
  outside the click gesture and was popup-blockable; the export now uses an
  unconditional same-origin `<a download>`, which isn't blocked.

### Removed (dead code)
- Deleted the never-mounted standalone simulator cluster — `IdSimulator`,
  `AdvancedPanel`, `FramingHero`, `HeroNumber`, `ResultsSection`,
  `results/MetricCards`, and `AppHeader` — plus the now-unused `reset` from
  `useIdSimulator`. The live app renders only the guided flow + `FullPicture`.

### Added
- `src/core/constants/scenarioPresets.ts` — tool-local opportunity/rollout presets
  and the neutral-readiness baseline, deliberately kept out of the shared engine.

### Verified
- Golden holds bit-exact: Balanced · Backed → current monthly `$96,000`, id-only
  monthly uplift `$5,298`, improved addressability `77.3%`, CDP `$3,500`.
- Both pickers strictly monotonic on monthly uplift: opportunity
  `$3,653 / $5,298 / $6,918`, rollout `$4,054 / $5,298 / $6,218`.
- Driven in a real browser: each fact moves its intended output (contextual is
  inverse; data spend up → uplift up; match-today moves the Breakdown baseline but
  not the annual), readiness nudges are up=better, Reset restores Balanced · Backed,
  the PDF downloads, and every tab fits with no inner scroll at lg/xl.

## [4.2.0] - Every control drives the model; no truncated labels

### Fixed
- **The per-property "Safari / iOS share" control now moves the ROI.** The engine
  reads a global `SAFARI_SHARE` constant that `useIdSimulator` was setting from a
  *separate* global override, so the prominent Configure Safari slider (and the
  tailored per-vertical Safari seed) were silently ignored while a duplicate
  Fine-tune slider secretly drove the math. `useIdSimulator` now sets
  `SAFARI_SHARE` to the **pageview-weighted average of every domain's Safari
  share**, making the per-property control the single source of truth. This also
  aligns the audience-visibility story (`deriveAudienceVisibility`) and the metric
  cards, which already used the per-domain value, with the engine.
- **Removed the duplicate global Safari slider** from Fine-tune → Economics (now 5
  economics sliders). Safari share lives only on the property, per the model.
- **No more truncated slider labels.** `AssumptionSlider` labels wrap instead of
  clipping (e.g. "Recovered Safari addressability"), so nothing is cut off in the
  Fine-tune tabs at any column width.

### Verified
- Every Configure and Fine-tune control was driven in a real browser and moves the
  expected result: pageviews, ads/page, display split, CPMs, risk, Safari share,
  recovered-Safari, CPM-uplift, contextual-CPM, CDP savings and all readiness
  factors change the ROI; **baseline addressability** correctly moves only the
  addressability *picture* (the Breakdown waterfall), not the recovery $, and
  **technical-deployment months** moves only the ramp curve - both by design.
- Golden values hold: for `{5M pv, $4.50/$12 CPM, 3.2 ads/page, 80% display, 35%
  Safari}`, moderate, id-only → current monthly `$96,000`, id-only monthly uplift
  `$5,298`.

## [4.1.0] - No-scroll full-picture console

The tool is embedded in an iframe on another site, so the experience is now
built to live entirely within one viewport - the visitor discovers and moves
around everything without the page ever scrolling.

### Changed
- **No-scroll "full picture" console** (`src/components/simulator/FullPicture.tsx`,
  new): the depth drawer's long scrolling page is replaced by a bounded, navigable
  console. A persistent **result rail** (the live annual value, headline metrics
  and both CTAs) stays on screen beside a **tabbed explore pane** - Configure,
  Fine-tune, Breakdown, Ramp, and a tailored Briefing when a business is
  recognised - collapsing to a compact **payoff bar** above the tabs on narrow
  screens. Every input updates the payoff live, so impact is always in view.
  Fine-tune splits its 14 benchmark sliders into Economics / Readiness sub-tabs so
  they stay no-scroll. The old scrolling `IdSimulator.tsx` remains as the
  standalone full-page variant.
- **`DepthDrawer`** is now a bounded frame: locked to the dynamic viewport height
  with `overflow-hidden` (via the new `.h-dvh-safe` utility), so it reports exactly
  one viewport to the parent iframe and never grows the host page.
- **`TailoredBriefing`** full variant re-laid out as a 2×2 block grid beside the
  proof panel, so the Briefing tab fits within the frame. The compact reveal
  variant is now a trimmed **teaser** - the identity gap plus the stakeholder
  proof metric only - with the full four-part briefing (context → gap → cost →
  AdFixus mapping) moved off the reveal and into the console's Briefing tab.
- **`Reveal`** now uses a tightened two-column layout when a briefing panel is
  present - the payoff sits beside the briefing teaser and the hero number is
  smaller - so the reveal still fits one viewport; on narrow screens the teaser is
  hidden and reached via the Briefing tab.

### Fixed
- **Interacting with the full picture no longer jumps to the top of the page.**
  `DepthDrawer`'s scroll-to-top effect depended on the inline `onClose` prop, whose
  reference changed on every parent render (e.g. moving a slider), re-firing the
  effect. Split into two effects so the scroll only runs on the open transition.
- **Donut chart** in "Where the recovery lands" no longer collapses to a sliver:
  removed the Recharts mount animation (which could stick at frame 0) and render it
  at a deterministic fixed size. As a bonus it no longer re-animates on every live
  input change.
- **No horizontal overflow in the console.** The explore-pane / result-rail grid
  now uses `min-w-0` (with `minmax(0,1fr)` tracks) so a wide child - a chart, a
  slider row, the briefing - can no longer stretch the grid past the frame and
  introduce a horizontal scrollbar on narrow screens.

### Removed
- **Top-left AdFixus wordmark** from the guided flow (`FlowShell`). The tool is
  embedded where the host page already carries the branding.

## [4.0.0] - Real branding + domain intelligence

The audit now recognises the visitor's business from their domain and tailors
everything around it - still 100% client-side, no backend of ours.

### Added
- **Domain-intelligence layer** (`src/core/intel/`): a new guided-flow step asks
  for the visitor's website and resolves a `DomainProfile` entirely in the browser
  - exact match against a bundled dataset of real open-web publishers
  (`knownDomains.ts`, 130 companies / 239 domains, auto-generated from AdFixus
  account research) → keyword heuristics for the vertical → a generic fallback.
- **Pre-filled model**: seven vertical archetypes (`verticals.ts`) seed the
  simulator (Safari share, display/video split, CPMs, anon %) so it lands in the
  right ballpark before a slider is touched - every value still freely adjustable.
- **Tailored briefing** (`TailoredBriefing.tsx`): a recommendation mirroring the
  AdFixus research playbook - context hook → identity gap → what it costs → how a
  publisher-owned durable ID closes it - with a **Revenue / Ad-ops / Data** proof
  metric versus an industry benchmark. Shown compact on the reveal, full atop the
  drawer. All proof figures are *published* AdFixus benchmarks; nothing
  company-specific is invented.
- **Visitor's real logo** (`BrandLogo.tsx`, `intel/logo.ts`): rendered in-browser
  via the Brandfetch Logo CDN when `VITE_BRANDFETCH_CLIENT_ID` is set, falling back
  to public favicon services. New optional env var; zero-config still works.

### Changed
- **Real AdFixus brand mark**: `AdfixusLogo` now renders the official brand SVG
  (bundled `src/assets/adfixus-wordmark.svg`) - the cyan arrow glyph + white
  wordmark - replacing the previous hand-drawn placeholder.
- Guided flow is now four screens (Provocation → **Domain** → Ask → Reveal); the
  reveal and the full simulator lead with the business-tailored briefing.
- Docs updated: `README.md`, `HANDOVER.md`, `docs/ADFIXUS_CORE_SPEC.md` (§5),
  `.env.example`.

---

## [3.1.0] - Production cleanup (current)

### Changed
- Docs rewritten to match the guided-flow + AI-era-consultative reality:
  `README.md`, `HANDOVER.md`, `docs/ADFIXUS_CORE_SPEC.md`, plus `SECURITY.md`.

### Removed
- Dead code left after the guided-flow rebuild: 14 unused shadcn/ui components, the
  unused toast subsystem (`use-toast`, `toast`, `toaster`), `use-mobile`, `App.css`,
  the unused lead-capture adapter (`core/adapters/leadAdapter.ts`), the golden-values
  `core/selfcheck.ts` and its convenience wrappers, and the stale `bun.lockb`.
- Unused dependencies: `@hookform/resolvers`, `react-hook-form`, `zod`,
  `next-themes`, `@tailwindcss/typography`, and the Radix packages behind the
  removed components (`react-dialog`, `react-progress`, `react-radio-group`,
  `react-select`, `react-tabs`, `react-toast`).

### Hygiene
- Untracked `.env`; `.gitignore` now covers `.env*` (keeping `.env.example`) and
  `.vercel`.

---

## [3.0.0] - ID Durability Simulator on the shared core (current)

### Rebuilt
- Rebuilt as a fully-configurable ID durability simulator **wired to the shared
  `src/core` engine** (`UnifiedCalculationEngine.calculate(..., scope: 'id-only')`)
  - replacing the old in-component math with the verified engine.
- Adopted the canonical **dark + bright-cyan** design system and the shared
  **embed module** (`src/core/embed/embed.ts`).

### Docs
- Rewrote `README.md`, `HANDOVER.md`, `SECURITY.md`; synced
  `docs/ADFIXUS_CORE_SPEC.md`.

### Removed
- All Supabase / backend / login remnants - the tool is 100% client-side.

---

## [2.0.0] - 2024-XX-XX - Developer Handover Refactor (historical)

### 🚀 Major Changes
- **Removed Supabase Integration**: Eliminated backend dependencies for simpler deployment
- **Dependency Cleanup**: Removed 15+ unused packages for smaller bundle size
- **Environment Configuration**: Added configurable meeting booking URL
- **Comprehensive Documentation**: Added developer handoff materials

### ✨ New Features
- **Environment Variables**: Configurable meeting booking URL via `VITE_MEETING_BOOKING_URL`
- **Local Storage**: Lead data now stored locally instead of database
- **Simplified Lead Capture**: Streamlined form without backend dependencies
- **Static Hosting Ready**: Fully client-side application suitable for any static host

### 🗑️ Removed
- **Supabase Dependencies**: 
  - `@supabase/supabase-js` package
  - `@tanstack/react-query` package
  - All Supabase client code and configuration
  - Email notification functionality
  - Database lead storage

- **Unused UI Components**:
  - `@radix-ui/react-accordion`
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-aspect-ratio`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-collapsible`
  - `@radix-ui/react-context-menu`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-hover-card`
  - `@radix-ui/react-menubar`
  - `@radix-ui/react-navigation-menu`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`

- **Unused Dependencies**:
  - `cmdk` - Command palette component
  - `date-fns` - Date utility library
  - `embla-carousel-react` - Carousel component
  - `input-otp` - OTP input component
  - `react-day-picker` - Date picker component
  - `react-resizable-panels` - Resizable panels
  - `sonner` - Toast notification library
  - `vaul` - Drawer component

- **Files and Directories**:
  - `src/integrations/supabase/` - Complete Supabase integration
  - `supabase/` - Supabase configuration and functions
  - `.env` - Environment file with Supabase credentials

### 🔧 Modified
- **App Component**: Removed React Query provider wrapper
- **Lead Capture Hook**: Simplified to use localStorage instead of Supabase
- **Results Dashboard**: Removed email sending functionality, simplified notifications
- **PDF Generator**: Made meeting booking URL configurable via environment variable

### 📚 Documentation
- **README.md**: Complete rewrite with quickstart guide and deployment instructions
- **.env.example**: Environment variable template
- **HANDOFF.md**: Comprehensive developer handoff guide
- **SECURITY.md**: Security documentation for static deployment
- **CHANGELOG.md**: This changelog documenting all changes

### 🎯 Benefits
- **Reduced Bundle Size**: ~40% smaller after removing unused dependencies
- **Simpler Deployment**: No backend required, deploy anywhere
- **Zero Configuration**: Works out of the box with minimal setup
- **Faster Builds**: Fewer dependencies mean faster installation and builds
- **Better Maintainability**: Cleaner codebase with less complexity
- **Enhanced Documentation**: Clear guides for future developers

### 🔄 Migration Notes
For existing deployments:
1. Remove Supabase environment variables
2. Add `VITE_MEETING_BOOKING_URL` environment variable
3. Update deployment to static hosting (no server required)
4. User data will be stored locally instead of database

### ⚠️ Breaking Changes
- **Lead Storage**: User information no longer saved to database
- **Email Notifications**: Automatic email sending removed
- **Environment Variables**: Supabase variables no longer needed
- **Dependencies**: Multiple packages removed (see removed section)

---

## [1.0.0] - Previous Version

### Features
- Identity Health Quiz with scoring system
- Revenue Calculator with advanced settings
- Comprehensive Results Dashboard with charts
- PDF export functionality with pdfmake
- Lead capture with Supabase integration
- Email notifications for completed assessments
- Responsive design with Tailwind CSS
- Multiple chart types using Recharts

### Dependencies
- React 18 with TypeScript
- Supabase for backend functionality
- React Query for data fetching
- Extensive Radix UI component library
- Multiple utility libraries for various features