// AdFixus core — risk scenario definitions based on organizational readiness
// and execution factors. Generic across any publisher engagement.

export type RiskScenario = 'conservative' | 'moderate' | 'optimistic';

export interface ReadinessDefaults {
  salesReadiness: number;
  trainingGaps: number;
  advertiserBuyIn: number;
  marketConditions: number;
}

export interface RiskMultipliers {
  rampUpMonths: number;
  adoptionRate: number;
  addressabilityEfficiency: number;
  capiDeploymentRate: number;
  premiumInventoryShare: number;
  cpmUpliftRealization: number;
  salesEffectiveness: number;
  cdpSavingsRealization: number;
  defaultReadiness: ReadinessDefaults;
}

export const RISK_SCENARIOS: Record<RiskScenario, RiskMultipliers> = {
  conservative: {
    rampUpMonths: 12,
    adoptionRate: 0.68,
    addressabilityEfficiency: 0.72,
    capiDeploymentRate: 0.70,
    premiumInventoryShare: 0.18,
    cpmUpliftRealization: 0.72,
    salesEffectiveness: 0.72,
    cdpSavingsRealization: 0.78,
    defaultReadiness: {
      salesReadiness: 0.55,
      trainingGaps: 0.50,
      advertiserBuyIn: 0.55,
      marketConditions: 0.65,
    },
  },
  moderate: {
    rampUpMonths: 9,
    adoptionRate: 0.75,
    addressabilityEfficiency: 0.80,
    capiDeploymentRate: 0.72,
    premiumInventoryShare: 0.22,
    cpmUpliftRealization: 0.82,
    salesEffectiveness: 0.78,
    cdpSavingsRealization: 0.85,
    defaultReadiness: {
      salesReadiness: 0.75,
      trainingGaps: 0.75,
      advertiserBuyIn: 0.80,
      marketConditions: 0.85,
    },
  },
  optimistic: {
    rampUpMonths: 6,
    adoptionRate: 0.82,
    addressabilityEfficiency: 0.85,
    capiDeploymentRate: 0.78,
    premiumInventoryShare: 0.24,
    cpmUpliftRealization: 0.85,
    salesEffectiveness: 0.80,
    cdpSavingsRealization: 0.88,
    defaultReadiness: {
      salesReadiness: 0.90,
      trainingGaps: 0.90,
      advertiserBuyIn: 0.90,
      marketConditions: 0.90,
    },
  },
};

export const RISK_SCENARIO_DESCRIPTIONS: Record<RiskScenario, string> = {
  conservative: 'Cautious execution with expected friction. 12-month sales ramp with training gaps and gradual advertiser adoption.',
  moderate: 'Solid enterprise rollout. 9-month ramp with good sales adoption and manageable friction.',
  optimistic: 'Strong execution, dedicated ownership. 6-month ramp with excellent sales training and advertiser buy-in.',
};

export const RISK_FACTORS = {
  conservative: [
    'Sales team not trained on addressable products',
    'Technical integration delays across properties',
    'Limited CAPI campaign setup by advertisers',
    'Organizational change management challenges',
    'Slow reporting and proof-of-value cycles',
  ],
  moderate: [
    'Some sales execution gaps',
    'Normal technical rollout timelines',
    'Partial CAPI adoption by advertisers',
    'Standard enterprise deployment friction',
  ],
  optimistic: [
    'Dedicated project leadership',
    'Sales team fully trained and incentivized',
    'Fast technical deployment',
    'Strong advertiser buy-in',
    'Clear success metrics and rapid feedback',
  ],
};
