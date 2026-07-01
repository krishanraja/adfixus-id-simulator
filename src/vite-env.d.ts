/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEETING_BOOKING_URL?: string;
  readonly VITE_COMPANY_NAME?: string;
  readonly VITE_BRANDFETCH_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
