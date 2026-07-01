// App-level runtime configuration derived from Vite env vars.
// Fully client-side; no network required.

export const MEETING_BOOKING_URL: string =
  import.meta.env.VITE_MEETING_BOOKING_URL ||
  'https://outlook.office.com/book/SalesTeambooking@adfixus.com';

export const COMPANY_NAME: string =
  import.meta.env.VITE_COMPANY_NAME || 'AdFixus';
