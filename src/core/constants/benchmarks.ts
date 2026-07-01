// AdFixus core — industry benchmarks & modelling constants.
// Generalized from the Vox engine; values are generic open-web-publisher
// defaults and can be overridden per-run via AssumptionOverrides.
// Single source of truth — keep identical across all AdFixus tools.
// See docs/ADFIXUS_CORE_SPEC.md for rationale behind each value.

export const CAPI_BENCHMARKS = {
  BASELINE_MATCH_RATE: 0.30, // 30% match rate without a durable ID / CAPI
  IMPROVED_MATCH_RATE: 0.75, // 75% with AdFixus (conservative)
  AGGRESSIVE_MATCH_RATE: 0.85, // 85% (upper bound)
  SERVICE_FEE_PERCENTAGE: 0.125, // 12.5%
  CAMPAIGN_ADOPTION_RATE: 0.20, // 20% of advertisers use CAPI
  CONVERSION_MULTIPLIER: 1.4, // 40% conversion improvement
  CTR_MULTIPLIER: 1.25, // 25% CTR improvement
};

export const MEDIA_PERFORMANCE_BENCHMARKS = {
  BASELINE_ROAS: 2.5,
  IMPROVED_ROAS: 3.5, // 40% improvement
  BASELINE_MAKEGOOD_RATE: 0.05, // 5%
  IMPROVED_MAKEGOOD_RATE: 0.02, // 2%
  PREMIUM_INVENTORY_SHARE: 0.20, // 20% of inventory sold as premium
  YIELD_UPLIFT_PERCENTAGE: 0.15, // 15% yield uplift on premium inventory
  // Make-goods only apply to direct-sold guaranteed inventory, not programmatic.
  DIRECT_SOLD_INVENTORY_SHARE: 0.40, // 40% direct-sold (typical premium publisher)
};

// Browser traffic shares & addressability. Fixed defaults for consistent
// modelling; a tool may expose these as inputs.
export const ADDRESSABILITY_BENCHMARKS = {
  SAFARI_SHARE: 0.35, // 35% Safari/iOS traffic (typical open-web publisher)
  CHROME_SHARE: 0.48, // 48% Chrome
  OTHER_SHARE: 0.17, // 17% other browsers

  BASELINE_TOTAL_ADDRESSABILITY: 0.65, // 65% of inventory currently addressable

  // Safari-specific addressability (the key KPI)
  CURRENT_SAFARI_ADDRESSABILITY: 0.0, // 0% — Safari users unaddressable due to ITP
  TARGET_SAFARI_ADDRESSABILITY: 0.35, // 35% internal calculation target (conservative)
  POC_PROMISE_ADDRESSABILITY: 0.20, // 20% typical external POC promise
  STRETCH_SAFARI_ADDRESSABILITY: 0.40, // 40% stretch goal

  CHROME_ADDRESSABILITY: 1.0,
  OTHER_ADDRESSABILITY: 1.0,

  CPM_IMPROVEMENT_FACTOR: 0.25, // 25% CPM boost on newly addressable inventory
  CONTEXTUAL_CPM_RATIO: 0.72, // Contextual CPM is ~72% of addressable CPM
};

export const OPERATIONAL_BENCHMARKS = {
  BASELINE_ID_MULTIPLIER: 3.5, // 1 user = 3.5 IDs without a durable solution
  IMPROVED_ID_MULTIPLIER: 1.08, // 1 user = 1.08 IDs with AdFixus
  CDP_MONTHLY_SAVINGS: 3500, // $/month CDP/data-platform saving (default)
  MANUAL_LABOR_HOURS_SAVED: 40, // hours/month of ad-ops labour saved
  HOURLY_RATE: 75, // $/hour blended ad-ops rate
  ID_REDUCTION_PERCENTAGE: 0.69, // 69% reduction in ID bloat
  CROSS_DOMAIN_OVERLAP: 0.17, // 17% average cross-domain user overlap (portfolios)
};

export const SCENARIO_MULTIPLIERS = {
  DEPLOYMENT: {
    SINGLE: 1.0, // Single domain baseline
    MULTI: 0.8, // 80% per additional domain (small portfolio)
    FULL: 1.2, // 120% with network effects (large portfolio)
  },
  RAMP_UP: {
    MONTH_1_3: 0.40, // 40% during POC (early adopters, first 3 months)
    MONTH_4_6: 0.80, // 80% in Q2
    MONTH_7_12: 1.0, // 100% from month 7 onwards
  },
};

// Campaign-specific CAPI values (illustrative)
export const CAPI_CAMPAIGN_VALUES = {
  ESTIMATED_CAPI_CAMPAIGNS_PER_MONTH: 10,
  AVG_CAMPAIGN_SPEND: 100000, // $100K average campaign spend
  SERVICE_FEE_PERCENTAGE: 0.125, // 12.5% service fee
  CONVERSION_RATE_MULTIPLIER: 1.40, // 40% conversion improvement
};

// CAPI base parameters — campaigns are derived from Business Readiness, not manual input
export const CAPI_BASE_PARAMETERS = {
  BASE_YEARLY_CAMPAIGNS: 12, // realistic enterprise publisher baseline
  BASE_AVG_CAMPAIGN_SPEND: 75000, // $75K baseline
  MIN_VOLUME_MULTIPLIER: 0.7, // Floor at 0.7x base (~8 campaigns/year min)
  MAX_VOLUME_MULTIPLIER: 1.4, // Cap at 1.4x base (~17 campaigns/year max)
  MAX_SPEND_MULTIPLIER: 1.15, // Cap at 1.15x base (~$86K/campaign max)
  MONTHLY_RAMP_WEIGHTS: [0.05, 0.08, 0.08, 0.08, 0.08, 0.10, 0.10, 0.10, 0.10, 0.08, 0.08, 0.07],
};

// CAPI pricing model constants (used for visualisation/PDF; see pricingConfig for editable rate card)
export const CAPI_PRICING_MODEL = {
  REVENUE_SHARE_PERCENTAGE: 0.125, // 12.5%
  CAMPAIGN_CAP_MONTHLY: 30000, // $30,000 per campaign per month cap
  CAP_THRESHOLD_SPEND: 240000, // $30K / 12.5% = $240K campaign spend
  ASSUMED_CONVERSION_MULTIPLIER: 1.40, // 40% conversion improvement baseline
  ILLUSTRATIVE_CAMPAIGN_SIZES: [50000, 100000, 150000, 200000, 240000, 300000, 350000, 400000, 500000],
};
