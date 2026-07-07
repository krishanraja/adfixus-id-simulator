# AdFixus - ID Durability Simulator

A **public, embeddable lead magnet** that shows an open-web publisher, in one
number, what a **durable, first-party identity** is worth to them. On the
AI-saturated web the anonymous majority has gone dark - cookies decay, Safari/ITP
blind returning visitors, AI crawlers eat the rest - so most publishers can no
longer recognise the humans on their own site. This tool makes that loss concrete
and quantifies the ad revenue a durable owned identity brings back into view.

It is **100% client-side** (no backend, no login, no secrets) and iframes cleanly
into **adfixus.com**. The headline is produced by the same verified `@/core`
engine used across AdFixus, so the number survives scrutiny later in a sales
conversation.

## The experience - an Apple-grade guided flow

The default surface (`src/components/flow/*`) is a calm, four-screen guided flow.
It asks for almost nothing, then reveals the payoff:

1. **Provocation** - the anonymous majority is already dark.
2. **Domain** - the visitor types their website; the tool recognises the business
   (real logo, vertical) and **pre-fills the model** from open-web benchmarks. This
   is the "magic populate" moment - see *Domain intelligence* below.
3. **Ask** - one tactile control: *roughly how big is your audience?* pre-seeded
   from the vertical; everything else is inferred.
4. **Reveal** - an animated hero number (the annual ad revenue a durable owned
   identity brings back) *plus a teaser of the briefing tailored to that business*
   - its identity gap and a role-calibrated proof metric - with one calm "book a
   conversation" CTA. The full four-part briefing (context, identity gap, what it
   costs, how AdFixus closes it) lives in the full-picture console's Briefing tab.

From the reveal, **"See the full picture / Customise"** (labelled **"See the full
picture & briefing / Customise"** once a business is recognised) opens a **depth
drawer** holding the no-scroll **`FullPicture` console**
(`src/components/simulator/FullPicture.tsx`): a persistent **result rail** - the
live annual value, headline metrics and two CTAs (book a conversation + a
downloadable PDF summary) - beside a tabbed explore pane. The console asks a
publisher only what they actually know; everything else is an open-web benchmark
default or a pre-defined scenario. The tabs are **Configure** (your audience -
monthly pageviews + one *Apple / Safari share* question, multi-site tucked behind
an optional reveal - and *What your ads earn*, your average display/video CPMs),
**Scenario** (two plain pickers - *how far do you want to push?* and *how will you
roll it out?* - each with a read-only "what we assumed" line, no raw dials),
**Breakdown** (addressability waterfall + display/video split), **Ramp** (the ramp
chart), and - when a domain was recognised - **Briefing** (the full tailored
briefing). On
narrow screens the rail collapses to a compact payoff bar above the tabs, and
every input updates the payoff live. The flow and the console **share one
simulator instance**, so the audience size chosen up front carries straight into
the detailed view.

## Architecture (grok it in 10 minutes)

```
Guided UI              State + engine bridge          Verified math
─────────              ─────────────────────          ─────────────
GuidedFlow  ─────────► useIdSimulator()  ───────────► @/core engine
(flow/ + simulator/)   (src/hooks/)                   (src/core/)
                       UnifiedCalculationEngine.calculate(
                         inputs, { scope: 'id-only' }, risk, overrides )
```

- **`GuidedFlow`** (`src/pages/Index.tsx` → `src/components/flow/GuidedFlow.tsx`)
  is the whole app. It owns the step state and one `useIdSimulator()` instance,
  renders the guided steps in a `FlowShell`, and mounts the `FullPicture` console
  inside a `DepthDrawer`.
- **`useIdSimulator`** (`src/hooks/useIdSimulator.ts`) is the single source of
  truth: it holds all inputs (domains, CPMs, risk, benchmark overrides, readiness)
  and recomputes results live by calling the `@/core` engine on every change. It
  also derives the "audience visibility" story (how much is invisible today, how
  much a durable ID recovers) that the guided flow narrates.
- **`@/core`** (`src/core/`) is the verified calculation engine. This tool uses
  `scope: 'id-only'` and reads `results.idInfrastructure` (Safari addressability
  recovery + CPM delta + CDP savings). See **[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)**
  for the formulas, benchmarks, and `AssumptionOverrides` surface.

## Domain intelligence (`src/core/intel/`)

When a visitor types their domain, the tool tailors everything around their
business - **fully client-side, no backend call of ours**:

- **Recognise the business.** `resolveDomain.ts` normalises the input to a
  registrable domain and resolves a `DomainProfile`: an exact match against a
  bundled dataset of real open-web publishers (`knownDomains.ts`, auto-generated
  from AdFixus account research) → keyword heuristics for the vertical → a generic
  open-web fallback.
- **Pre-fill the model.** Each of the seven vertical archetypes (`verticals.ts`)
  carries directional input seeds (Safari share, display/video split, CPMs, anon %)
  so the simulator lands in the right ballpark before a slider is touched.
- **Tailor the recommendation.** The same archetype supplies the four-part briefing
  (context → identity gap → what it costs → how AdFixus closes it) and a
  **Revenue / Ad-ops / Data** proof metric versus an industry benchmark. Every proof
  figure is a *published* AdFixus benchmark; nothing company-specific is invented.
- **Show their real logo.** `BrandLogo` renders the visitor's logo via the
  Brandfetch Logo CDN (if `VITE_BRANDFETCH_CLIENT_ID` is set) with public favicon
  fallbacks - rendered directly by the browser, never fetched or stored by us.

The tool works with zero configuration; a Brandfetch client id only upgrades the
logo fidelity.

## Run it

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # → dist/  (static SPA)
npm run preview  # serve the built dist/
npm run lint
```

No environment setup is required to run it. The only variable is
`VITE_MEETING_BOOKING_URL` - the "book a conversation" link (see **Env** below and
`.env.example`).

## Env

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_MEETING_BOOKING_URL` | The booking link behind the CTAs. | AdFixus sales booking URL |
| `VITE_COMPANY_NAME` *(optional)* | Company name shown in the UI. | `AdFixus` |
| `VITE_BRANDFETCH_CLIENT_ID` *(optional)* | Public Brandfetch Logo CDN client id - shows visitors' real brand logos on the domain step. Falls back to public favicon services when unset. **Public value only; never a secret API key.** | *(unset → favicon fallback)* |

`VITE_*` values are baked into the client bundle at build time, so they must only
ever hold **public** information. There are no secrets in this app.

## Deploy on Vercel (public)

It is a static SPA - deploy on Vercel (or any static host):

- Framework preset **Vite**, build `npm run build`, output directory `dist/`.
- Add the SPA rewrite so deep links resolve: `/* → /index.html`.
- Set `VITE_MEETING_BOOKING_URL` if you want a custom booking link.
- This tool is **public** - no auth.

## Embed it in adfixus.com

The app reports its content height to the parent page so it iframes with no
host-page scrollbar - the bounded full-picture console keeps any internal overflow
in thin, contained scrollbars of its own. The embed module
(`src/core/embed/embed.ts`) is initialised once from `src/main.tsx` via
`initAdfixusEmbed({ appName })`.

**Protocol.** The child posts `{ type: 'setHeight', height, source, trigger }` to
the parent whenever its height changes (>10px, capped at `maxHeight` 5000px). It
answers `requestHeight` (→ re-send height) and `ping` (→ `pong`), and validates
the parent origin (default `https://www.adfixus.com`).

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
</script>
```

To embed on an origin other than `www.adfixus.com`, pass a `parentOrigin` to
`initAdfixusEmbed` in `src/main.tsx`. Full protocol in
**[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md) §4**.

## File map

```
src/
  main.tsx                     App bootstrap; calls initAdfixusEmbed()
  App.tsx                      Router + TooltipProvider shell
  config.ts                    Reads VITE_* env (booking URL, company name)
  pages/
    Index.tsx                  Renders <GuidedFlow /> - the whole app
    NotFound.tsx               Catch-all route
  components/
    flow/                      The Apple-grade guided flow (default surface)
      GuidedFlow.tsx           Orchestrates steps + owns the shared simulator + domain profile
      FlowShell.tsx            Full-viewport stage: progress dots, transitions (no wordmark - host page brands it)
      Provocation.tsx          Step 0 - the anonymous majority is going dark
      DomainStep.tsx           Step 1 - recognise the visitor's site & pre-fill the model
      AskStep.tsx              Step 2 wrapper - one question (audience size)
      AudienceSizeControl.tsx  The single tactile audience-size control
      Reveal.tsx               Step 3 - animated hero number + briefing teaser + CTA
      TailoredBriefing.tsx     Business-tailored recommendation (context→gap→AdFixus→proof)
      DepthDrawer.tsx          Bounded, no-scroll frame that hosts the FullPicture console
      motion.ts                Shared framer-motion variants
    simulator/                 The no-scroll "full picture" console (drawer)
      FullPicture.tsx          The drawer surface: result rail / payoff bar + tabbed explore pane (Configure, Scenario, Breakdown, Ramp, Briefing); hosts the two scenario pickers + read-only "what we assumed" lines
      DomainPortfolio.tsx      "Your audience": monthly pageviews + one Apple/Safari share question (multi-site + name behind an optional reveal). Ads/page & display-video split are inferred, not asked
      BasicInputs.tsx          Average display & video CPM (the "What your ads earn" card)
      results/                 AddressabilityWaterfall, RampChart, DisplayVideoBreakdown
    ui/                        Vendored shadcn/ui primitives (only the used ones)
    brand/AdfixusLogo.tsx      Real AdFixus wordmark/glyph (canonical brand SVG; the favicon is derived from this geometry - not rendered in the live flow)
    brand/BrandLogo.tsx        The visitor's own logo (Brandfetch CDN + favicon fallback)
  hooks/
    useIdSimulator.ts          State + @/core engine bridge (source of truth)
    useAnimatedNumber.ts       Count-up animation for hero numbers
  core/                        Verified AdFixus calculation engine - see core spec
    engine/                    UnifiedCalculationEngine + domain aggregation
    constants/                 Benchmarks, risk scenarios, readiness, pricing rate card, scenarioPresets (tool-local opportunity/rollout presets)
    types/                     Domain + scenario/override types
    intel/                     Domain intelligence: verticals, known-domain map, resolver, logo
    embed/embed.ts             Iframe height-reporting module
    index.ts                   @/core public barrel
  utils/
    formatting.ts              Currency / number / percentage formatters
    idPdf.ts                   Client-side PDF (pdfmake, lazy-loaded)
  index.css                    Design tokens + utility classes (dark + cyan)
```

## Docs

- **[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)** - the engine (math,
  benchmarks, `AssumptionOverrides`), the design system, and the embed protocol.
- **[HANDOVER.md](HANDOVER.md)** - a fast orientation for a new owner.
- **[SECURITY.md](SECURITY.md)** - the (small) security surface.

## Tech stack

React 18 · TypeScript · Vite 5 · Tailwind 3 · shadcn/ui (Radix) · framer-motion ·
Recharts · pdfmake · React Router.
