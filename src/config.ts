// App-level runtime configuration derived from Vite env vars.
// Fully client-side; no network required.

export const MEETING_BOOKING_URL: string =
  import.meta.env.VITE_MEETING_BOOKING_URL ||
  'https://outlook.office.com/book/SalesTeambooking@adfixus.com';

export const COMPANY_NAME: string =
  import.meta.env.VITE_COMPANY_NAME || 'AdFixus';

// Optional Brandfetch Logo CDN client id. When set, the domain-entry step shows
// the visitor's real brand logo (rendered directly by the browser via <img>,
// per Brandfetch's hotlinking policy). Left unset, the tool falls back to public
// favicon services - it stays fully client-side and needs no key either way.
// This id is PUBLIC (it only unlocks browser-rendered logo URLs); never put a
// secret Brandfetch API key here.
export const BRANDFETCH_CLIENT_ID: string =
  import.meta.env.VITE_BRANDFETCH_CLIENT_ID || '';
