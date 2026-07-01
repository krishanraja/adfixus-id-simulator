// AdFixus core - scenario-based calculator types.
// Generalized from the Vox engine: inputs carry generic CoreDomain[] objects
// instead of Vox domain IDs, so the engine is publisher-agnostic.
import type { CoreDomain } from './domain';

export type DeploymentType = 'single' | 'multi' | 'full';
export type ScopeType = 'id-only' | 'id-capi' | 'id-capi-performance';
export type TimeframeType = '1-year' | '3-year';

export interface ScenarioState {
  deployment: DeploymentType;
  scope: ScopeType;
}

export interface SimplifiedInputs {
  domains: CoreDomain[]; // one property (lead magnets) or many (portfolio)
  displayCPM: number;
  videoCPM: number;
  capiLineItemShare: number; // 0.20 - 1.00 (share of campaign spend that is CAPI-enabled)
  domainPageviewOverrides?: Record<string, number>;
  safariShareOverrides?: Record<string, number>;
}

export interface CapiConfiguration {
  yearlyCampaigns: number;
  avgCampaignSpend: number;
  pocCampaigns: number;
  fullYearCampaigns: number;
  monthlyDistribution: number[];
}

export interface AssumptionOverrides {
  // ID Infrastructure
  safariBaselineAddressability?: number;
  safariWithDurableId?: number;
  targetSafariAddressability?: number;
  cpmUpliftFactor?: number;
  cdpCostReduction?: number;

  // CAPI
  capiServiceFee?: number;
  capiMatchRate?: number;
  capiYearlyCampaigns?: number;
  capiAvgCampaignSpend?: number;
  capiLineItemShare?: number;

  // Media Performance
  premiumInventoryShare?: number;
  premiumYieldUplift?: number;

  // Business Readiness Factors
  readinessFactors?: {
    salesReadiness?: number;
    technicalDeploymentMonths?: number;
    advertiserBuyIn?: number;
    organizationalOwnership?: number;
    marketConditions?: number;
    trainingGaps?: number;
    integrationDelays?: number;
    resourceAvailability?: number;
  };
}

export interface PricingModel {
  pocFlatFee: number;
  pocDurationMonths: number;
  pocMonthlyEquivalent: number;
  fullContractMonthly: number;
  capiServiceFeeRate: number;
  totalMonthlyCapiSpend: number;
  monthlyCapiServiceFees: number;
}

export interface ROIAnalysis {
  totalMonthlyBenefits: number;
  totalAnnualBenefits: number;
  costs: {
    pocPhaseMonthly: number;
    fullContractMonthly: number;
    platformFeePOC: number;
    platformFeeFull: number;
    capiServiceFees: number;
  };
  netMonthlyROI: { pocPhase: number; fullContract: number };
  netAnnualROI: { pocPhase: number; fullContract: number };
  roiMultiple: { pocPhase: number; fullContract: number };
  paybackMonths: { pocPhase: number; fullContract: number };
}

export interface UnifiedResults {
  scenario: ScenarioState;
  inputs: SimplifiedInputs;
  assumptionOverrides?: AssumptionOverrides;
  riskScenario?: 'conservative' | 'moderate' | 'optimistic';
  riskAdjustmentSummary?: {
    unadjustedMonthlyUplift: number;
    adjustedMonthlyUplift: number;
    adjustmentPercentage: number;
  };
  pricing: PricingModel;
  roiAnalysis: ROIAnalysis;
  idInfrastructure: {
    addressabilityRecovery: number;
    cpmImprovement: number;
    cdpSavings: number;
    monthlyUplift: number;
    annualUplift: number;
    details: {
      safariShare: number;
      currentSafariAddressability: number;
      targetSafariAddressability: number;
      safariAddressabilityImprovement: number;
      currentAddressability: number;
      improvedAddressability: number;
      totalAddressabilityImprovement: number;
      newlyAddressableImpressions: number;
      addressabilityRevenue: number;
      cdpSavingsRevenue: number;
      idReductionPercentage: number;
      monthlyCdpSavings: number;
    };
  };
  capiCapabilities?: {
    matchRateImprovement: number;
    baselineCapiSpend: number;
    capiEligibleSpend: number;
    totalCapiSpendWithImprovement: number;
    conversionTrackingRevenue: number;
    campaignServiceFees: number;
    capiLaborSavings: number;
    monthlyUplift: number;
    annualUplift: number;
    details: {
      baselineMatchRate: number;
      improvedMatchRate: number;
      conversionImprovement: number;
      ctrImprovement: number;
    };
    capiConfiguration: CapiConfiguration;
    netNewCampaignRevenue?: number;
    netNewCampaignRate?: number;
  };
  mediaPerformance?: {
    advertiserROASImprovement: number;
    makeGoodReduction: number;
    premiumPricingPower: number;
    monthlyUplift: number;
    annualUplift: number;
    details: {
      baselineROAS: number;
      improvedROAS: number;
      baselineMakeGoodRate: number;
      improvedMakeGoodRate: number;
      makeGoodSavings: number;
      directSoldRevenue: number;
      directSoldShare: number;
      premiumYieldMonthly: number;
    };
  };
  totals: {
    currentMonthlyRevenue: number;
    totalMonthlyUplift: number;
    totalAnnualUplift: number;
    threeYearProjection: number;
    percentageImprovement: number;
  };
  breakdown: {
    idInfrastructurePercent: number;
    capiPercent: number;
    performancePercent: number;
  };
}

export interface MonthlyProjection {
  month: number;
  monthLabel: string;
  currentRevenue: number;
  projectedRevenue: number;
  uplift: number;
  rampUpFactor: number;
  roiMultiple: number;
  netROI: number;
}
