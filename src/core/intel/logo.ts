// Client-side logo resolution for a visitor's domain - the "magic" moment.
//
// We never fetch or store the asset; the browser renders it directly via <img>,
// which is exactly what these public services are for. Candidates are tried in
// order, best-quality first, falling back to favicon services that need no key:
//
//   1. Brandfetch Logo CDN (real brand logo) - only if a public client id is set.
//   2. DuckDuckGo icon service (no key).
//   3. Google favicon service (no key).
//
// A <BrandLogo> component walks this list on each <img> error.

import { BRANDFETCH_CLIENT_ID } from '@/config';

/** Ordered list of logo/icon URLs to try for a domain. */
export function logoCandidates(domain: string, size = 128): string[] {
  const d = encodeURIComponent(domain);
  const urls: string[] = [];
  if (BRANDFETCH_CLIENT_ID) {
    // Square brand icon; falls back to a generated lettermark if Brandfetch has
    // no asset, so this URL effectively always renders something on-brand.
    urls.push(
      `https://cdn.brandfetch.io/${d}/w/${size}/h/${size}/icon?c=${encodeURIComponent(
        BRANDFETCH_CLIENT_ID,
      )}&fallback=lettermark`,
    );
  }
  urls.push(`https://icons.duckduckgo.com/ip3/${d}.ico`);
  urls.push(`https://www.google.com/s2/favicons?domain=${d}&sz=${size}`);
  return urls;
}
