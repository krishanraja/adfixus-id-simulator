# Handover — adfixus-id-simulator

## The AdFixus tool family (read this first)

You are taking over **three** related tools that share one brand, one design
system, and one calculation engine:

| Repo | What it is |
|------|------------|
| **adfixus-id-simulator** (this repo) | Public lead magnet — measures **ID durability** benefits for an open-web publisher |
| **adfixus-capi-calculator** | Public lead magnet — measures **CAPI (Conversions API)** benefits on top of the ID |
| **adfixus-sales** | Internal tool — pulls intelligence on a target business to fuel a **proposal** |

A fourth repo, **vox-adfixus**, has been **retired**. It was originally built as
an extension of this simulator to model one specific customer (Vox Media) and
became the most mathematically robust of the set. Its engine and assumptions were
**generalized and moved into the shared core** that now lives in all three repos
(`src/core/`); its Vox-specific data (real domains, that customer's negotiated
pricing and browser mix) was stripped out. Do not resurrect vox — the intelligence
is already here. See **[docs/ADFIXUS_CORE_SPEC.md](docs/ADFIXUS_CORE_SPEC.md)** for
the full engine + design + embedding spec (identical in every repo).

## What this repo is for

A publisher answers a short quiz + a few inputs (monthly pageviews, CPMs, Safari
share) and instantly sees the revenue they lose to unaddressable Safari/ITP
traffic and what durable identity would recover — with a downloadable PDF. It is
designed to be **iframed into adfixus.com** as a top-of-funnel lead magnet.

## How it contributes to the business

- Top-of-funnel demand gen: a credible, self-serve number that starts a sales
  conversation. Every run can capture a lead and offer a "book a meeting" CTA.
- Consistent, defensible math (the same engine the sales team uses internally),
  so the number a prospect sees survives scrutiny later in the cycle.

## What changed in this consolidation

- **All Supabase + backend + login removed.** The tool is now 100% client-side;
  nothing breaks when the old Supabase projects are shut down. PDF is generated
  in-browser; leads persist to `localStorage["adfixus_leads"]` through a
  pluggable `leadAdapter` (swap in a CRM later without touching the UI).
- **Adopted the canonical dark + bright-cyan design system** (identical
  `src/index.css` + `tailwind.config.ts` across the three tools).
- **Vendored the shared, verified engine** at `src/core/` and the shared
  **embed module** (replaces the old inline `index.html` script).

## What you need to do next

1. **Run it:** `npm install && npm run dev` (port 8080). No env needed.
2. **Verify the math:** run the golden-values self-check (command in the README).
3. **Deploy:** it's a static SPA — `npm run build` → host `dist/` on any static
   host (Vercel/Netlify/S3). Add the SPA rewrite `/* → /index.html`.
4. **Embed on adfixus.com:** drop the iframe + `message` snippet from the spec
   (§5) onto the page; it auto-resizes.
5. **(Optional) leads:** if you want leads somewhere other than `localStorage`,
   implement `LeadAdapter` and call `setLeadAdapter()` once at startup.
6. **Recommended follow-up (engineering):** the tool's results dashboard still
   uses the repo's original in-component math (which is mathematically identical
   to the *base* Vox engine). To surface the *fuller* robust model, wire the
   results onto `calculateIdDurability()` from `@/core/engine` — the entry point,
   types, and a passing golden test are already in place. This is the single most
   valuable enhancement and is intentionally low-risk (engine is verified).

## Ideas for development

- Shareable result permalinks (encode inputs in the URL) for sales follow-up.
- "Compare scenarios" side-by-side; A/B-tested headlines; light analytics events.
- Promote `src/core/` to a private npm package shared by all three repos (today
  it's vendored identically — see the spec § Keeping repos in sync).

## What's disconnected (and how to bring it back)

| Was | Now | To restore |
|-----|-----|-----------|
| Supabase edge function `send-pdf-email` (Resend) | Client-side PDF download | Implement an `emailProvider`/`LeadAdapter` against your own service |
| Supabase lead storage | `localStorage["adfixus_leads"]` | Implement `LeadAdapter` |

No secrets or external calls remain in the codebase.
