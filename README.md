# AdFixus - ID Durability Simulator

A **public, embeddable lead magnet** that shows an open-web publisher, in one
number, what a **durable, first-party identity** is worth to them. On the
AI-saturated web the anonymous majority has gone dark, cookies decay, Safari/ITP
blind returning visitors, AI crawlers eat the rest, so most publishers can no
longer recognise the humans on their own site. This tool makes that loss concrete
and quantifies the ad revenue a durable owned identity brings back into view.

It is **100% client-side** (no backend, no login, no secrets) and iframes cleanly
into **adfixus.com**. The headline is produced by the same verified `@/core`
engine used across AdFixus, so the number survives scrutiny later in a sales
conversation.

## The experience: an Apple-grade guided flow

The default surface (`src/components/flow/*`) is a calm, three-screen guided flow.
It asks for almost nothing, then reveals the payoff:

1. **Provocation**: the anonymous majority is already dark.
2. **Ask**: one tactile control: *roughly how big is your audience?* Everything
   else is inferred from open-web benchmarks.
3. **Reveal**: an animated hero number: the annual ad revenue a durable owned
   identity brings back into view, with one calm "book a conversation" CTA.

From the reveal, **"See the full picture / Customise"** opens a **depth drawer**
holding the complete configurable simulator (`src/components/simulator/*`):
multi-domain portfolio, CPMs, an advanced "Configure assumptions" panel, the
8 readiness sliders, an addressability waterfall, a ramp chart, metric cards, and
a downloadable PDF. The flow and the drawer **share one simulator instance**, so
the audience size chosen up front carries straight into the detailed view.

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
  renders the guided steps in a `FlowShell`, and mounts the full `IdSimulator`
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

## Run it

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # → dist/  (static SPA)
npm run preview  # serve the built dist/
npm run lint
```

No environment setup is required to run it. The only variable is
`VITE_MEETING_BOOKING_URL`, the "book a conversation" link (see **Env** below and
`.env.example`).

## Env

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_MEETING_BOOKING_URL` | The booking link behind the CTAs. | AdFixus sales booking URL |
| `VITE_COMPANY_NAME` *(optional)* | Company name shown in the UI. | `AdFixus` |

`VITE_*` values are baked into the client bundle at build time, so they must only
ever hold **public** information. There are no secrets in this app.

## Deploy on Vercel (public)

It is a static SPA, deploy on Vercel (or any static host):

- Framework preset **Vite**, build `npm run build`, output directory `dist/`.
- Add the SPA rewrite so deep links resolve: `/* → /index.html`.
- Set `VITE_MEETING_BOOKING_URL` if you want a custom booking link.
- This tool is **public**, no auth.

## Embed it in adfixus.com

The app reports its content height to the parent page so it iframes with no inner
scrollbar. The embed module (`src/core/embed/embed.ts`) is initialised once from
`src/main.tsx` via `initAdfixusEmbed({ appName })`.

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
    Index.tsx                  Renders <GuidedFlow />, the whole app
    NotFound.tsx               Catch-all route
  components/
    flow/                      The Apple-grade guided flow (default surface)
      GuidedFlow.tsx           Orchestrates steps + owns the shared simulator
      FlowShell.tsx            Full-viewport stage: wordmark, progress dots, transitions
      Provocation.tsx          Step 0: the anonymous majority is going dark
      AskStep.tsx              Step 1 wrapper: one question
      AudienceSizeControl.tsx  The single tactile audience-size control
      Reveal.tsx               Step 2: animated hero number + CTA
      DepthDrawer.tsx          Slides in the full configurable simulator
      motion.ts                Shared framer-motion variants
    simulator/                 The full configurable simulator (in the drawer)
      IdSimulator.tsx          Assembles inputs + results; accepts a shared simulator
      FramingHero.tsx          AI-era framing headline
      HeroNumber.tsx           Animated headline number
      DomainPortfolio.tsx      Model 1..N domains
      BasicInputs.tsx          Pageviews, CPMs, execution outlook (risk)
      AdvancedPanel.tsx        "Configure assumptions" + 8 readiness sliders
      AssumptionSlider.tsx     Labelled slider with tooltip
      ResultsSection.tsx       Charts, breakdowns, PDF + CTA
      results/                 MetricCards, AddressabilityWaterfall, RampChart, DisplayVideoBreakdown
    ui/                        Vendored shadcn/ui primitives (only the used ones)
    brand/AdfixusLogo.tsx      Wordmark
    AppHeader.tsx              Standalone header (suppressed when embedded)
  hooks/
    useIdSimulator.ts          State + @/core engine bridge (source of truth)
    useAnimatedNumber.ts       Count-up animation for hero numbers
  core/                        Verified AdFixus calculation engine, see core spec
    engine/                    UnifiedCalculationEngine + domain aggregation
    constants/                 Benchmarks, risk scenarios, readiness, pricing rate card
    types/                     Domain + scenario/override types
    embed/embed.ts             Iframe height-reporting module
    index.ts                   @/core public barrel
  utils/
    formatting.ts              Currency / number / percentage formatters
    idPdf.ts                   Client-side PDF (pdfmake, lazy-loaded)
  index.css                    Design tokens + utility classes (dark + cyan)
```

## Docs

- **[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)**: the engine (math,
  benchmarks, `AssumptionOverrides`), the design system, and the embed protocol.
- **[HANDOVER.md](HANDOVER.md)**: a fast orientation for a new owner.
- **[SECURITY.md](SECURITY.md)**: the (small) security surface.

## Tech stack

React 18 · TypeScript · Vite 5 · Tailwind 3 · shadcn/ui (Radix) · framer-motion ·
Recharts · pdfmake · React Router.
