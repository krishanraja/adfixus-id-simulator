# Security - adfixus-id-simulator (ID Durability Simulator)

## Overview

This is a **public, 100% client-side** lead magnet. All calculations run in the
browser (`src/core` engine); no data is sent to a backend. There is **no login,
no database, and no API keys / secrets** of any kind.

## Security model

- **No backend:** all math and PDF generation happen client-side, no server-side
  attack surface, no secrets to leak.
- **No secrets:** the app requires none. Its only environment variables are
  `VITE_MEETING_BOOKING_URL` (a public booking link), `VITE_COMPANY_NAME` (optional
  display name), and `VITE_BRANDFETCH_CLIENT_ID` (an optional PUBLIC Brandfetch Logo
  CDN client id, never a secret API key). All are safe to expose. `VITE_*` values
  are baked into the client and must only ever hold public information.
- **No lead capture / storage:** the tool captures nothing. There is no
  `localStorage`/`sessionStorage`/cookie use and nothing is persisted. The only user
  action that leaves the browser is following the public booking link
  (`VITE_MEETING_BOOKING_URL`), opened in a new tab with `rel="noreferrer"`. If you
  later add lead capture, keep any credentials **server-side** (never in a `VITE_`
  var, which is baked into the client bundle).
- **Third-party requests:** the app is otherwise offline, but two categories of
  request leave the browser. (1) The domain a visitor types on the "your site" step
  is embedded in brand-logo/favicon image URLs the browser loads directly from
  `cdn.brandfetch.io` (only when `VITE_BRANDFETCH_CLIENT_ID` is set),
  `icons.duckduckgo.com`, and `www.google.com/s2/favicons`; no asset is fetched or
  stored by the app. (2) `index.html` loads the Montserrat webfont from Google Fonts
  (`fonts.googleapis.com` / `fonts.gstatic.com`). There is no
  `fetch`/`XMLHttpRequest`, analytics, or telemetry of any kind.
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
