# Handover - AdFixus ID Durability Simulator

A fast orientation for the engineer taking this over. For the full picture read
**[README.md](README.md)**; for the engine internals read
**[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)**.

## What this is

A **public, embeddable lead magnet** for open-web publishers. It answers one
question - *how much ad revenue is a durable, first-party identity worth to you?* -
through a calm, Apple-grade guided flow, with the no-scroll full-picture console one
click away for anyone who wants to see the working.

The framing is deliberately **AI-era and consultative**: the anonymous majority
has gone dark (cookie decay, Safari/ITP, AI crawlers), and the tool quantifies the
audience, and the revenue, a durable owned identity brings back into view. It is
a conversation starter, not a commercial offer.

## The 5-minute mental model

```
Index.tsx → GuidedFlow ──owns──► useIdSimulator()  ──calls──► @/core engine
                │                       │
                │ steps 0-3             │ live results + audience-visibility story
                ▼                       ▼
Provocation → Domain → Ask → Reveal   FullPicture (no-scroll console) inside DepthDrawer
   (in FlowShell)                      (opened from Reveal, shares the SAME instance)
        │
        └─ Domain step resolves a DomainProfile via @/core/intel (bundled, client-
           side): recognises the business, seeds the model, and drives the tailored
           briefing (context → identity gap → AdFixus mapping → role-calibrated proof).
```

- **Everything is client-side.** No backend, no login, no database, no secrets.
  The domain lookup is bundled intelligence + public favicon/logo CDNs rendered by
  the browser - no server call of our own.
- **One state instance.** `GuidedFlow` creates a single `useIdSimulator()` and
  passes it into both the guided steps and the drawer's `FullPicture` console, so
  the audience size chosen in the flow carries into the full picture and back.
- **The math is not in the UI.** `useIdSimulator` builds inputs and calls
  `UnifiedCalculationEngine.calculate(inputs, { scope: 'id-only' }, risk,
  overrides)` from `@/core`; results components read `results.idInfrastructure`.
  Charts use `UnifiedCalculationEngine.generateMonthlyProjection(results)`.

## Where things live

| You want to change… | Edit |
|---------------------|------|
| The guided-flow copy / steps | `src/components/flow/GuidedFlow.tsx` (+ `Provocation`, `DomainStep`, `AskStep`, `Reveal`) |
| The domain lookup / vertical seeds & narrative | `src/core/intel/` (`verticals.ts`, `resolveDomain.ts`, `knownDomains.ts`) |
| The tailored briefing / proof metrics | `src/components/flow/TailoredBriefing.tsx` (+ `proof` in `verticals.ts`) |
| The real brand logo | `src/components/brand/AdfixusLogo.tsx` + `src/assets/adfixus-wordmark.svg` |
| The visitor-logo lookup | `src/components/brand/BrandLogo.tsx` + `src/core/intel/logo.ts` |
| The one audience control | `src/components/flow/AudienceSizeControl.tsx` |
| The full-picture console (tabs, inputs, result rail) | `src/components/simulator/FullPicture.tsx` (+ `BasicInputs.tsx`, `DomainPortfolio.tsx`) |
| Results / charts / PDF | `src/components/simulator/results/*` (charts) + the result rail in `FullPicture.tsx`, `src/utils/idPdf.ts` |
| Inputs ↔ engine wiring | `src/hooks/useIdSimulator.ts` |
| The Scenario-tab presets (opportunity / rollout) + "what we assumed" copy | `src/core/constants/scenarioPresets.ts` (tool-local; not the shared engine) |
| The math, benchmarks, defaults | `src/core/` (see core spec) - do not fork per-repo |
| The booking link | `VITE_MEETING_BOOKING_URL` (see `.env.example`) |
| Real brand logos on domain entry | `VITE_BRANDFETCH_CLIENT_ID` (optional; favicon fallback otherwise) |
| Brand tokens (dark + cyan) | `src/index.css` (`:root`) + `tailwind.config.ts` |
| Embed behaviour | `src/core/embed/embed.ts`, initialised in `src/main.tsx` |

## The full-picture console

The depth-drawer console (`FullPicture`) is a no-scroll surface: a tabbed explore
pane beside a persistent result rail (the live annual value, headline metrics and
both CTAs) that collapses to a compact payoff bar on narrow screens. It asks a
publisher **only what they actually know**; everything else is an open-web
benchmark default (often seeded per vertical) or a pre-defined scenario. Its tabs:

- **Configure** - `DomainPortfolio` = **"Your audience"**: monthly pageviews + one
  **Apple / Safari share** question (`domains[i].safariShare`); running a portfolio
  and property names hide behind an optional "Run more than one site?" reveal.
  `BasicInputs` = **"What your ads earn"**: average display/video CPM. Ad density
  and the display/video split are **inferred** (vertical seed / default), not asked;
  `contextualCpmRatio` and `cdpMonthlySavings` stay at their benchmark defaults and
  are no longer surfaced as questions; "addressable today" is derived from the Apple
  share (`1 − AppleShare`), so there is no `baselineAddressability` input either.
- **Scenario** - two plain pickers, each with a read-only "what we assumed" line
  (derived from the preset numbers via `opportunityAssumption` / `rolloutAssumption`
  in `scenarioPresets.ts` - no raw dials):
  - *How far do you want to push?* (**Cautious / Balanced / Ambitious** →
    `setOpportunity`) sets the two upside assumptions only AdFixus can benchmark:
    `targetSafariAddressability` (the recovered fraction of the Apple slice: 0.70 /
    0.85 / 0.95) and `cpmUpliftFactor`.
  - *How will you roll it out?* (**Lean / Backed / Strategic** → `setRollout`) picks
    the realisation backbone: it sets `risk` and clears `readiness` to `{}`.

  Presets live in `src/core/constants/scenarioPresets.ts` (tool-local product
  data, deliberately **not** in the shared engine). First paint is Balanced ·
  Backed → the golden `$9,679/mo · 65% → 94.75%`.
- **Breakdown** - `AddressabilityWaterfall` tells the total-addressability story
  (today `1 − AppleShare` → with AdFixus, the recovered Apple slice) and a
  traceability strip walking recovered slice → impressions → full-potential $ →
  realised-at-rollout $ (capability vs realisation; from `deriveAudienceVisibility`).
  Plus `DisplayVideoBreakdown`. No "Safari today 0%" absolute anywhere.
- **Ramp** - `RampChart` (the first 12 months; ramp length follows the rollout's
  backbone: Lean 12 / Backed 9 / Strategic 6).
- **Briefing** - the full `TailoredBriefing`, only when a domain was recognised.

Every input updates the payoff live; nothing leaves the browser. To change what a
publisher is asked, edit `DomainPortfolio` / `BasicInputs` (Configure) or the
scenario presets; the engine never needs touching.

## The domain-intelligence layer (`src/core/intel/`)

The guided flow opens by asking for the visitor's website and tailoring the whole
audit to it - entirely client-side:

- **`resolveDomain.ts`** normalises whatever is typed to a registrable domain, then
  resolves a `DomainProfile`: an exact match against `knownDomains.ts` (real
  research accounts) → keyword heuristics for the vertical → a generic open-web
  fallback. It never throws; junk input yields the generic profile.
- **`verticals.ts`** holds the seven vertical archetypes: simulator input seeds
  (Safari share, display/video split, CPMs, anon %) plus the four-part narrative
  (context → identity gap → cost → AdFixus mapping) and a Revenue / Ad-ops / Data
  **proof metric**. Every proof figure is a *published* AdFixus benchmark - nothing
  company-specific is invented.
- **`knownDomains.ts`** is **auto-generated** from the AdFixus account-research
  sheet ("Company Scores" tab) - 130 companies / 239 domains with their vertical,
  anon share, Tranco rank, stack sophistication, identity gap and hook. Regenerate
  it from the sheet rather than hand-editing.
- **`logo.ts` / `BrandLogo`** render the visitor's real logo via the Brandfetch
  Logo CDN (when `VITE_BRANDFETCH_CLIENT_ID` is set) with public favicon fallbacks,
  straight in the browser. No asset is fetched or stored server-side.

`GuidedFlow` applies the resolved profile's seeds to the shared simulator and passes
the profile into `TailoredBriefing` (shown as a compact teaser on the Reveal, and
in full in the console's Briefing tab). See core spec §6.

## What to do next

1. **Run it:** `npm install && npm run dev` (port 8080). No env needed.
2. **Build / lint:** `npm run build` and `npm run lint` both pass clean. The only
   lint warnings are the vendored shadcn `react-refresh` notices on
   `ui/badge.tsx` and `ui/button.tsx` - expected, safe to ignore.
3. **Deploy:** static SPA on Vercel (preset Vite, output `dist/`, SPA rewrite
   `/* → /index.html`). Public - no auth.
4. **Embed on adfixus.com:** drop the iframe + `message` snippet from the README /
   core spec §4 onto the page; it auto-resizes.

## Ideas for later

- Shareable result permalinks (encode inputs in the URL) for sales follow-up.
- Light, privacy-safe analytics on the reveal + "see the full picture" clicks.
- Promote `src/core/` to a private npm package if it comes to be shared again.
