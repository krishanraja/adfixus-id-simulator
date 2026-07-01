# Security - adfixus-id-simulator (ID Durability Simulator)

## Overview

This is a **public, 100% client-side** lead magnet. All calculations run in the
browser (`src/core` engine); no data is sent to a backend. There is **no login,
no database, and no API keys / secrets** of any kind.

## Security model

- **No backend:** all math and PDF generation happen client-side, no server-side
  attack surface, no secrets to leak.
- **No secrets:** the app requires none. The only environment variable is
  `VITE_MEETING_BOOKING_URL` (a public link), which is safe to expose. `VITE_*`
  values are baked into the client and must only ever hold public information.
- **No lead capture / storage:** the tool captures nothing. The only user action
  that leaves the browser is following the public booking link
  (`VITE_MEETING_BOOKING_URL`). If you later add lead capture, keep any credentials
  **server-side** (never in a `VITE_` var, which is baked into the client bundle).
- **XSS:** React's default escaping; all inputs are numeric sliders/fields, not
  free-form HTML.

## Deployment

- Serve over **HTTPS** (Vercel/Netlify/S3+CDN all do this by default).
- Add the SPA rewrite `/* → /index.html`.
- Embedding is via `postMessage` height-reporting (parent origin
  `https://www.adfixus.com`); no cross-origin data is read from the parent.

## Maintenance

- Run `npm audit` periodically; keep React and dependencies patched.
- No PII or payment data is collected, so there is no breach protocol beyond
  keeping the static host and its TLS current.
