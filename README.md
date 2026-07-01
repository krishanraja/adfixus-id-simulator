# AdFixus Identity Durability Simulator

A public, embeddable **lead magnet** that lets an open-web publisher measure the
revenue impact of **durable identity** — recovering Safari/ITP addressability,
lifting CPMs on newly-addressable inventory, and cutting CDP/ID-bloat costs.

Part of the AdFixus tool family (with `adfixus-capi-calculator` and
`adfixus-sales`). All three share one design system and one calculation engine —
see **[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)** and
**[HANDOVER.md](HANDOVER.md)**.

## Run it

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # → dist/  (static, deploy anywhere)
npm run preview
```

No environment setup is required to run it. The only optional variable is
`VITE_MEETING_BOOKING_URL` (the "book a meeting" link). See `.env.example`.

## Key facts

- **100% client-side.** No backend, no Supabase, no login, no API keys. PDF is
  generated in the browser; captured leads are stored in `localStorage`
  (`adfixus_leads`) via a pluggable adapter you can point at a CRM later.
- **Embeddable.** Reports its height to the parent page so it iframes cleanly
  into adfixus.com (`src/core/embed/embed.ts`). Parent snippet is in the spec.
- **Math lives in `src/core/`** — the shared, verified AdFixus engine. Run
  `npx esbuild src/core/selfcheck.ts --bundle --platform=node --format=cjs --outfile=/tmp/afx.cjs && node /tmp/afx.cjs`
  to confirm the golden values.

## Tech stack

React 18 · TypeScript · Vite 5 · Tailwind 3 · shadcn/ui (Radix) · Recharts ·
pdfmake · React Router.
