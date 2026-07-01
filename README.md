# AdFixus Identity Durability Simulator

A public, embeddable **lead magnet** that lets an open-web publisher measure the
revenue impact of **durable identity** — recovering Safari/ITP addressability,
lifting CPMs on newly-addressable inventory, and cutting CDP/ID-bloat costs. It is
**fully configurable** (basic inputs, an advanced "Configure assumptions" panel,
readiness sliders, and a multi-domain portfolio) and is **wired directly to the
shared `src/core` engine** (`scope: 'id-only'`), so the number it shows survives
scrutiny later in the sales cycle.

Part of the AdFixus tool family (with `adfixus-capi-calculator` and
`adfixus-sales`). All three share one design system and one calculation engine —
see **[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)** and
**[HANDOVER.md](HANDOVER.md)**.

## Who it's for & how it contributes

- **For open-web publishers** (public, self-serve). Top-of-funnel demand gen: a
  credible, self-serve number that starts a sales conversation, with an optional
  lead capture + "book a meeting" CTA.
- **Contributes to AdFixus** by being the first, most-shareable touch in the tool
  family, running the *same* engine the internal sales team uses — so the story is
  consistent from lead magnet to proposal.

## Run it

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # → dist/  (static SPA)
npm run preview
```

No environment setup is required to run it. The only optional variable is
`VITE_MEETING_BOOKING_URL` (the "book a meeting" link). See `.env.example`.

## Key facts

- **100% client-side.** No backend, no login, no API keys, no secrets. PDF is
  generated in the browser; captured leads are stored in `localStorage`
  (`adfixus_leads`) via a pluggable adapter you can point at a CRM later.
- **Math lives in `src/core`** — the shared, verified AdFixus engine. The UI
  (`useIdSimulator.ts`) calls `UnifiedCalculationEngine.calculate(..., scope:
  'id-only')`. Run
  `npx esbuild src/core/selfcheck.ts --bundle --platform=node --format=cjs --outfile=/tmp/afx.cjs && node /tmp/afx.cjs`
  to confirm the golden values.
- **Canonical dark + bright-cyan brand**, shared with the other two tools.

## Deploy on Vercel

It is a static SPA — deploy on Vercel (or any static host):

```bash
npm run build    # → dist/
```

On Vercel, framework preset **Vite** (output `dist/`); add the SPA rewrite so deep
links resolve: `/* → /index.html`. No environment variables are required (set
`VITE_MEETING_BOOKING_URL` if you want a custom booking link). This tool is
**public** — no auth.

## Embed it in adfixus.com

The app reports its content height to the parent page so it iframes cleanly with
no inner scrollbar (`src/core/embed/embed.ts`, called from `src/main.tsx`).

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

The embed validates parent origin `https://www.adfixus.com` by default; pass a
different `parentOrigin` to `initAdfixusEmbed` to embed elsewhere. Full protocol in
**[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md) §5**.

## Tech stack

React 18 · TypeScript · Vite 5 · Tailwind 3 · shadcn/ui (Radix) · Recharts ·
pdfmake · React Router.
