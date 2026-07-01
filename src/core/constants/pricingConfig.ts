// AdFixus core — commercial pricing config (used by the internal sales tool).
//
// These are the AdFixus RATE-CARD defaults. Every value is intended to be
// surfaced as an editable slider/input in the sales tool so a seller can model
// any deal — start from rate card, then apply discounts as levers. None of
// these are tied to any specific customer's negotiated terms.
//
// NOTE: lead-magnet tools (id-simulator, capi-calculator) do NOT import this —
// they show customer benefits only, never AdFixus pricing.

export interface PricingConfig {
  // Platform licence
  rateCardMonthly: number;        // standard list price, $/month
  annualLicenseFee: number;       // list annual licence, $/year
  includedPageviews: number;      // pageviews/month included in the licence
  overageRatePerThousand: number; // $ per 1,000 excess pageviews

  // Proof-of-concept phase
  pocFlatFee: number;             // total $ for the POC period
  pocDurationMonths: number;      // POC length in months

  // CAPI commercial terms
  capiServiceFeeRate: number;     // share of CAPI campaign revenue, e.g. 0.125
  capiCampaignCapMonthly: number; // per-campaign monthly cap, $

  // Optional additional fees
  connectionFeeMonthly: number;   // $/month per active connection
  streamEventFeePerThousand: number; // $ per 1,000 stream events
  additionalDomainFee: number;    // $/month per additional domain

  // Discount levers (0 = no discount) — sliders in the UI
  contractDiscountPercent: number; // % off rate card for a committed contract
  pocDiscountPercent: number;      // % off during POC
  annualFeeIncrease: number;       // annual uplift applied in multi-year models
}

// Rate-card defaults (no negotiated discount applied).
export const DEFAULT_PRICING: PricingConfig = {
  rateCardMonthly: 26000,
  annualLicenseFee: 312000, // 26,000 * 12
  includedPageviews: 70000000,
  overageRatePerThousand: 0.048,

  pocFlatFee: 15000,
  pocDurationMonths: 3,

  capiServiceFeeRate: 0.125,
  capiCampaignCapMonthly: 30000,

  connectionFeeMonthly: 287,
  streamEventFeePerThousand: 0.64,
  additionalDomainFee: 204,

  contractDiscountPercent: 0,
  pocDiscountPercent: 0,
  annualFeeIncrease: 0.08,
};

// Derived helpers ----------------------------------------------------------

/** Effective full-contract monthly fee after applying the contract discount. */
export function effectiveContractMonthly(p: PricingConfig): number {
  return Math.round(p.rateCardMonthly * (1 - p.contractDiscountPercent / 100));
}

/** Effective POC monthly-equivalent fee after applying the POC discount. */
export function effectivePocMonthly(p: PricingConfig): number {
  const base = p.pocFlatFee / p.pocDurationMonths;
  return Math.round(base * (1 - p.pocDiscountPercent / 100));
}
