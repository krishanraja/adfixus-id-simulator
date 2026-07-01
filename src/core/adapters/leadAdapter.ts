// AdFixus core — lead-capture adapter.
//
// The tools are 100% client-side (no Supabase, no backend). Lead capture is
// therefore pluggable: the default implementation just persists the lead to
// localStorage so nothing is lost and nothing breaks offline. A future owner
// who wants leads in a CRM/ESP implements this one interface and swaps it in —
// nothing else in the app changes.

export interface Lead {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  domain?: string;
  /** Any tool-specific payload (inputs, computed results, etc.). */
  context?: Record<string, unknown>;
}

export interface LeadAdapter {
  submit(lead: Lead): Promise<void>;
}

const STORAGE_KEY = 'adfixus_leads';

/** Default adapter: append the lead to localStorage. Never throws. */
export const localStorageLeadAdapter: LeadAdapter = {
  async submit(lead: Lead): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: unknown[] = raw ? JSON.parse(raw) : [];
      existing.push({ ...lead, submittedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      /* storage unavailable — swallow so the UX flow never blocks */
    }
  },
};

// The active adapter. Swap this (or reassign via setLeadAdapter) to integrate
// a real backend later.
let activeAdapter: LeadAdapter = localStorageLeadAdapter;

export function setLeadAdapter(adapter: LeadAdapter): void {
  activeAdapter = adapter;
}

export function submitLead(lead: Lead): Promise<void> {
  return activeAdapter.submit(lead);
}
