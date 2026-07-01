// AdFixus core - unified ROI calculation engine.
//
// Generalized from the Vox engine. Models three stacked benefit categories
// (ID Infrastructure, CAPI Capabilities, Media Performance), each modulated by
// risk scenario + readiness factors + deployment multiplier, wrapped with
// ROI/pricing. Publisher-agnostic: callers pass generic CoreDomain[] and an
// optional editable PricingConfig.
//
// Scope selects which benefit stacks are included:
//   'id-only'            → ID Infrastructure only   (id-simulator lead magnet)
//   'id-capi'            → + CAPI Capabilities       (capi-calculator lead magnet)
//   'id-capi-performance'→ + Media Performance       (sales full proposal)
import type {
  SimplifiedInputs,
  UnifiedResults,
  ScenarioState,
  MonthlyProjection,
  AssumptionOverrides,
  PricingModel,
  ROIAnalysis,
  CapiConfiguration,
} from '../types/scenarios';
import {
  CAPI_BENCHMARKS,
  MEDIA_PERFORMANCE_BENCHMARKS,
  ADDRESSABILITY_BENCHMARKS,
  OPERATIONAL_BENCHMARKS,
  SCENARIO_MULTIPLIERS,
  CAPI_CAMPAIGN_VALUES,
  CAPI_BASE_PARAMETERS,
} from '../constants/benchmarks';
import { aggregateDomainInputs } from './domainAggregation';
import { RISK_SCENARIOS, type RiskScenario } from '../constants/riskScenarios';
import {
  DEFAULT_PRICING,
  effectiveContractMonthly,
  type PricingConfig,
} from '../constants/pricingConfig';

export class UnifiedCalculationEngine {
  static calculate(
    inputs: SimplifiedInputs,
    scenario: ScenarioState,
    riskScenario: RiskScenario = 'moderate',
    overrides?: AssumptionOverrides,
    pricingConfig: PricingConfig = DEFAULT_PRICING,
  ): UnifiedResults {
    const aggregated = aggregateDomainInputs(
      inputs.domains,
      inputs.displayCPM,
      inputs.videoCPM,
      inputs.domainPageviewOverrides,
      inputs.safariShareOverrides,
    );
    const {
      totalMonthlyPageviews,
      totalMonthlyImpressions,
      displayCPM,
      videoCPM,
      weightedDisplayVideoSplit,
      weightedSafariShare,
    } = aggregated;

    const risk = { ...RISK_SCENARIOS[riskScenario] };

    // Apply readiness adjustments if provided. Readiness affects ALL benefit
    // categories (deployment risk) and, separately, CAPI campaign volume.
    if (overrides?.readinessFactors) {
      const rf = overrides.readinessFactors;

      if (rf.salesReadiness !== undefined) {
        const salesCpmFactor = 0.4 + rf.salesReadiness * 0.8;
        risk.cpmUpliftRealization *= salesCpmFactor;
        risk.premiumInventoryShare *= salesCpmFactor;
        risk.salesEffectiveness *= rf.salesReadiness;
      }
      if (rf.trainingGaps !== undefined) {
        const trainingAdoptionFactor = 0.5 + rf.trainingGaps * 0.6;
        risk.adoptionRate *= trainingAdoptionFactor;
        risk.addressabilityEfficiency *= trainingAdoptionFactor;
      }
      if (rf.advertiserBuyIn !== undefined) {
        const buyInCpmFactor = 0.5 + rf.advertiserBuyIn * 0.7;
        risk.cpmUpliftRealization *= buyInCpmFactor;
        risk.capiDeploymentRate *= rf.advertiserBuyIn;
      }
      if (rf.organizationalOwnership !== undefined) {
        risk.adoptionRate *= rf.organizationalOwnership;
      }
      if (rf.technicalDeploymentMonths !== undefined) {
        risk.rampUpMonths = rf.technicalDeploymentMonths;
      }
      if (rf.integrationDelays !== undefined) {
        risk.addressabilityEfficiency *= rf.integrationDelays;
      }
      if (rf.resourceAvailability !== undefined) {
        risk.adoptionRate *= rf.resourceAvailability;
        if (rf.resourceAvailability < 0.75) {
          risk.rampUpMonths = Math.min(18, risk.rampUpMonths * (1 + (0.75 - rf.resourceAvailability)));
        }
      }
      if (rf.marketConditions !== undefined) {
        const marketMultiplier = rf.marketConditions;
        risk.addressabilityEfficiency *= marketMultiplier;
        risk.cpmUpliftRealization *= marketMultiplier;
        risk.cdpSavingsRealization *= marketMultiplier;
      }
    }

    const displayShare = weightedDisplayVideoSplit / 100;
    const videoShare = 1 - displayShare;
    const totalImpressions = totalMonthlyImpressions;
    const displayImpressions = totalImpressions * displayShare;
    const videoImpressions = totalImpressions * videoShare;

    const currentDisplayRevenue = (displayImpressions / 1000) * displayCPM;
    const currentVideoRevenue = (videoImpressions / 1000) * videoCPM;
    const currentMonthlyRevenue = currentDisplayRevenue + currentVideoRevenue;

    const baseIdInfrastructure = this.calculateIdInfrastructure(
      totalMonthlyPageviews,
      displayCPM,
      videoCPM,
      scenario,
      currentMonthlyRevenue,
      displayImpressions,
      videoImpressions,
      weightedSafariShare,
      overrides,
    );

    const adjustedAddressabilityRevenue =
      baseIdInfrastructure.details.addressabilityRevenue * risk.addressabilityEfficiency * risk.cpmUpliftRealization;
    const adjustedCdpSavingsRevenue = baseIdInfrastructure.details.cdpSavingsRevenue * risk.cdpSavingsRealization;
    const adjustedMonthlyUplift = adjustedAddressabilityRevenue + adjustedCdpSavingsRevenue;

    const riskAdjustedIdInfrastructure = {
      ...baseIdInfrastructure,
      monthlyUplift: adjustedMonthlyUplift,
      annualUplift: adjustedMonthlyUplift * 12,
      details: {
        ...baseIdInfrastructure.details,
        addressabilityRevenue: adjustedAddressabilityRevenue,
        cdpSavingsRevenue: adjustedCdpSavingsRevenue,
      },
    };

    const adoptedIdInfrastructure = {
      ...riskAdjustedIdInfrastructure,
      monthlyUplift: riskAdjustedIdInfrastructure.monthlyUplift * risk.adoptionRate,
      annualUplift: riskAdjustedIdInfrastructure.annualUplift * risk.adoptionRate,
      details: {
        ...riskAdjustedIdInfrastructure.details,
        addressabilityRevenue: riskAdjustedIdInfrastructure.details.addressabilityRevenue * risk.adoptionRate,
        cdpSavingsRevenue: riskAdjustedIdInfrastructure.details.cdpSavingsRevenue * risk.adoptionRate,
      },
    };

    let adoptedCapiCapabilities;
    if (scenario.scope === 'id-capi' || scenario.scope === 'id-capi-performance') {
      const baseCapiCapabilities = this.calculateCapiCapabilities(
        inputs, scenario, currentMonthlyRevenue, riskScenario, overrides, pricingConfig,
      );
      const riskAdjustedCapiCapabilities = {
        ...baseCapiCapabilities,
        monthlyUplift: baseCapiCapabilities.monthlyUplift * risk.capiDeploymentRate * risk.salesEffectiveness,
        annualUplift: baseCapiCapabilities.annualUplift * risk.capiDeploymentRate * risk.salesEffectiveness,
        conversionTrackingRevenue: baseCapiCapabilities.conversionTrackingRevenue * risk.capiDeploymentRate,
        campaignServiceFees: baseCapiCapabilities.campaignServiceFees * risk.salesEffectiveness,
      };
      adoptedCapiCapabilities = {
        ...riskAdjustedCapiCapabilities,
        monthlyUplift: riskAdjustedCapiCapabilities.monthlyUplift * risk.adoptionRate,
        annualUplift: riskAdjustedCapiCapabilities.annualUplift * risk.adoptionRate,
      };
    }

    let adoptedMediaPerformance;
    if (scenario.scope === 'id-capi-performance') {
      const baseMediaPerformance = this.calculateMediaPerformance(
        totalMonthlyPageviews, displayCPM, videoCPM, weightedDisplayVideoSplit,
        scenario, currentMonthlyRevenue, displayImpressions, videoImpressions, overrides,
      );
      const riskAdjustedMediaPerformance = {
        ...baseMediaPerformance,
        monthlyUplift: baseMediaPerformance.monthlyUplift * (risk.premiumInventoryShare / 0.30) * risk.cpmUpliftRealization,
        annualUplift: baseMediaPerformance.annualUplift * (risk.premiumInventoryShare / 0.30) * risk.cpmUpliftRealization,
        premiumPricingPower: baseMediaPerformance.premiumPricingPower * (risk.premiumInventoryShare / 0.30),
      };
      adoptedMediaPerformance = {
        ...riskAdjustedMediaPerformance,
        monthlyUplift: riskAdjustedMediaPerformance.monthlyUplift * risk.adoptionRate,
        annualUplift: riskAdjustedMediaPerformance.annualUplift * risk.adoptionRate,
      };
    }

    const totalMonthlyUplift =
      adoptedIdInfrastructure.monthlyUplift +
      (adoptedCapiCapabilities?.monthlyUplift || 0) +
      (adoptedMediaPerformance?.monthlyUplift || 0);
    const totalAnnualUplift = totalMonthlyUplift * 12;
    const threeYearProjection = totalAnnualUplift * 3;
    const percentageImprovement =
      currentMonthlyRevenue > 0 ? (totalMonthlyUplift / currentMonthlyRevenue) * 100 : 0;

    const optimisticRisk = RISK_SCENARIOS.optimistic;
    const hasCapi = scenario.scope === 'id-capi' || scenario.scope === 'id-capi-performance';
    const hasMediaPerformance = scenario.scope === 'id-capi-performance';
    const unadjustedMonthlyUplift =
      (baseIdInfrastructure.monthlyUplift +
        (hasCapi
          ? this.calculateCapiCapabilities(inputs, scenario, currentMonthlyRevenue, 'optimistic', undefined, pricingConfig).monthlyUplift
          : 0) +
        (hasMediaPerformance
          ? this.calculateMediaPerformance(
              totalMonthlyPageviews, displayCPM, videoCPM, weightedDisplayVideoSplit,
              scenario, currentMonthlyRevenue, displayImpressions, videoImpressions, undefined,
            ).monthlyUplift
          : 0)) * optimisticRisk.adoptionRate;

    const adjustmentPercentage =
      unadjustedMonthlyUplift > 0
        ? ((unadjustedMonthlyUplift - totalMonthlyUplift) / unadjustedMonthlyUplift) * 100
        : 0;

    const breakdown = {
      idInfrastructurePercent: totalMonthlyUplift > 0 ? (adoptedIdInfrastructure.monthlyUplift / totalMonthlyUplift) * 100 : 0,
      capiPercent: totalMonthlyUplift > 0 ? ((adoptedCapiCapabilities?.monthlyUplift || 0) / totalMonthlyUplift) * 100 : 0,
      performancePercent: totalMonthlyUplift > 0 ? ((adoptedMediaPerformance?.monthlyUplift || 0) / totalMonthlyUplift) * 100 : 0,
    };

    const pricing = this.calculatePricing(inputs, riskScenario, overrides, pricingConfig);
    const roiAnalysis = this.calculateROI(totalMonthlyUplift, pricing);

    return {
      scenario,
      inputs,
      assumptionOverrides: overrides,
      riskScenario,
      riskAdjustmentSummary: { unadjustedMonthlyUplift, adjustedMonthlyUplift: totalMonthlyUplift, adjustmentPercentage },
      pricing,
      roiAnalysis,
      idInfrastructure: adoptedIdInfrastructure,
      capiCapabilities: adoptedCapiCapabilities,
      mediaPerformance: adoptedMediaPerformance,
      totals: { currentMonthlyRevenue, totalMonthlyUplift, totalAnnualUplift, threeYearProjection, percentageImprovement },
      breakdown,
    };
  }

  private static calculateIdInfrastructure(
    monthlyPageviews: number,
    displayCPM: number,
    videoCPM: number,
    scenario: ScenarioState,
    currentMonthlyRevenue: number,
    displayImpressions: number,
    videoImpressions: number,
    weightedSafariShare: number,
    overrides?: AssumptionOverrides,
  ) {
    const safariShare = ADDRESSABILITY_BENCHMARKS.SAFARI_SHARE;
    const currentTotalAddressability = ADDRESSABILITY_BENCHMARKS.BASELINE_TOTAL_ADDRESSABILITY;
    const currentSafariAddressability = ADDRESSABILITY_BENCHMARKS.CURRENT_SAFARI_ADDRESSABILITY;
    const targetSafariAddressability = overrides?.targetSafariAddressability ?? ADDRESSABILITY_BENCHMARKS.TARGET_SAFARI_ADDRESSABILITY;
    const safariAddressabilityImprovement = targetSafariAddressability - currentSafariAddressability;

    const addressabilityGain = safariShare * safariAddressabilityImprovement;
    const improvedTotalAddressability = currentTotalAddressability + addressabilityGain;

    const totalImpressions = displayImpressions + videoImpressions;
    const safariImpressions = totalImpressions * safariShare;
    const newlyAddressableSafariImpressions = safariImpressions * safariAddressabilityImprovement;
    const newlyAddressableDisplay = displayImpressions * safariShare * safariAddressabilityImprovement;
    const newlyAddressableVideo = videoImpressions * safariShare * safariAddressabilityImprovement;

    const cpmUpliftFactor = overrides?.cpmUpliftFactor ?? ADDRESSABILITY_BENCHMARKS.CPM_IMPROVEMENT_FACTOR;
    const contextualRatio = ADDRESSABILITY_BENCHMARKS.CONTEXTUAL_CPM_RATIO;

    const addressableDisplayCPM = displayCPM * (1 + cpmUpliftFactor);
    const addressableVideoCPM = videoCPM * (1 + cpmUpliftFactor);
    const contextualDisplayCPM = displayCPM * contextualRatio;
    const contextualVideoCPM = videoCPM * contextualRatio;
    const displayCpmDelta = addressableDisplayCPM - contextualDisplayCPM;
    const videoCpmDelta = addressableVideoCPM - contextualVideoCPM;

    const displayUplift = (newlyAddressableDisplay / 1000) * displayCpmDelta;
    const videoUplift = (newlyAddressableVideo / 1000) * videoCpmDelta;
    const cpmImprovement = displayUplift + videoUplift;

    const monthlyCdpSavings = OPERATIONAL_BENCHMARKS.CDP_MONTHLY_SAVINGS;
    const deploymentMultiplier = this.getDeploymentMultiplier(scenario.deployment);

    const addressabilityRevenue = cpmImprovement * deploymentMultiplier;
    const cdpSavingsRevenue = monthlyCdpSavings * deploymentMultiplier;
    const monthlyUplift = addressabilityRevenue + cdpSavingsRevenue;
    const annualUplift = monthlyUplift * 12;

    return {
      addressabilityRecovery: addressabilityGain * 100,
      cpmImprovement,
      cdpSavings: monthlyCdpSavings,
      monthlyUplift,
      annualUplift,
      details: {
        safariShare: safariShare * 100,
        currentSafariAddressability: currentSafariAddressability * 100,
        targetSafariAddressability: targetSafariAddressability * 100,
        safariAddressabilityImprovement: safariAddressabilityImprovement * 100,
        currentAddressability: currentTotalAddressability * 100,
        improvedAddressability: improvedTotalAddressability * 100,
        totalAddressabilityImprovement: addressabilityGain * 100,
        newlyAddressableImpressions: newlyAddressableSafariImpressions,
        addressabilityRevenue,
        cdpSavingsRevenue,
        idReductionPercentage: OPERATIONAL_BENCHMARKS.ID_REDUCTION_PERCENTAGE * 100,
        monthlyCdpSavings,
      },
    };
  }

  private static calculateCapiConfiguration(
    riskScenario: RiskScenario = 'moderate',
    overrides?: AssumptionOverrides,
  ): CapiConfiguration {
    const base = CAPI_BASE_PARAMETERS;

    const buildDistribution = (yearlyCampaigns: number, avgCampaignSpend: number): CapiConfiguration => {
      const pocCampaigns = Math.min(2, yearlyCampaigns);
      const remainingCampaigns = Math.max(0, yearlyCampaigns - pocCampaigns);
      const q2Campaigns = Math.round(remainingCampaigns * 0.20);
      const q3Campaigns = Math.round(remainingCampaigns * 0.30);
      const q4Campaigns = remainingCampaigns - q2Campaigns - q3Campaigns;
      const month4_6 = q2Campaigns / 3;
      const month7_9 = q3Campaigns / 3;
      const month10_12 = q4Campaigns / 3;
      const month1_3 = pocCampaigns / 3;
      const monthlyDistribution = [
        Math.round(month1_3 * 10) / 10,
        Math.round(month1_3 * 10) / 10,
        Math.round((pocCampaigns - month1_3 * 2) * 10) / 10,
        Math.round(month4_6 * 10) / 10,
        Math.round(month4_6 * 10) / 10,
        Math.round((q2Campaigns - month4_6 * 2) * 10) / 10,
        Math.round(month7_9 * 10) / 10,
        Math.round(month7_9 * 10) / 10,
        Math.round((q3Campaigns - month7_9 * 2) * 10) / 10,
        Math.round(month10_12 * 10) / 10,
        Math.round(month10_12 * 10) / 10,
        Math.round((q4Campaigns - month10_12 * 2) * 10) / 10,
      ];
      return { yearlyCampaigns, avgCampaignSpend, pocCampaigns, fullYearCampaigns: yearlyCampaigns, monthlyDistribution };
    };

    if (overrides?.capiYearlyCampaigns !== undefined || overrides?.capiAvgCampaignSpend !== undefined) {
      const yearlyCampaigns = overrides.capiYearlyCampaigns ?? base.BASE_YEARLY_CAMPAIGNS;
      const avgCampaignSpend = overrides.capiAvgCampaignSpend ?? base.BASE_AVG_CAMPAIGN_SPEND;
      return buildDistribution(yearlyCampaigns, avgCampaignSpend);
    }

    const scenarioDefaults = RISK_SCENARIOS[riskScenario].defaultReadiness;
    const salesReadiness = overrides?.readinessFactors?.salesReadiness ?? scenarioDefaults.salesReadiness;
    const trainingGaps = overrides?.readinessFactors?.trainingGaps ?? scenarioDefaults.trainingGaps;
    const advertiserBuyIn = overrides?.readinessFactors?.advertiserBuyIn ?? scenarioDefaults.advertiserBuyIn;
    const marketConditions = overrides?.readinessFactors?.marketConditions ?? scenarioDefaults.marketConditions;

    const salesMultiplier = Math.max(0.5, Math.min(1.5, 0.7 + (salesReadiness - 0.5) * 1.5));
    const trainingMultiplier = Math.max(0.6, Math.min(1.3, 0.8 + (trainingGaps - 0.5) * 1.0));
    const buyInMultiplier = Math.max(0.5, Math.min(1.3, 0.7 + (advertiserBuyIn - 0.5) * 1.2));

    const volumeMultiplier = Math.max(
      base.MIN_VOLUME_MULTIPLIER,
      Math.min(base.MAX_VOLUME_MULTIPLIER, salesMultiplier * trainingMultiplier * buyInMultiplier),
    );
    const spendMultiplier = Math.min(base.MAX_SPEND_MULTIPLIER, Math.max(0.6, Math.min(1.2, 0.7 + (marketConditions - 0.5) * 1.0)));

    const yearlyCampaigns = Math.max(2, Math.round(base.BASE_YEARLY_CAMPAIGNS * volumeMultiplier));
    const avgCampaignSpend = Math.round(base.BASE_AVG_CAMPAIGN_SPEND * spendMultiplier);
    return buildDistribution(yearlyCampaigns, avgCampaignSpend);
  }

  private static calculateCapiCapabilities(
    inputs: SimplifiedInputs,
    scenario: ScenarioState,
    currentMonthlyRevenue: number,
    riskScenario: RiskScenario = 'moderate',
    overrides?: AssumptionOverrides,
    pricingConfig: PricingConfig = DEFAULT_PRICING,
  ) {
    const capiConfig = this.calculateCapiConfiguration(riskScenario, overrides);

    const baselineMatchRate = CAPI_BENCHMARKS.BASELINE_MATCH_RATE;
    const improvedMatchRate = overrides?.capiMatchRate ?? CAPI_BENCHMARKS.IMPROVED_MATCH_RATE;
    const matchRateImprovement = (improvedMatchRate / baselineMatchRate - 1) * 100;

    const avgMonthlyCapiCampaigns = capiConfig.yearlyCampaigns / 12;
    const avgCampaignSpend = capiConfig.avgCampaignSpend;
    const capiLineItemShare = overrides?.capiLineItemShare ?? inputs.capiLineItemShare;
    const serviceFee = overrides?.capiServiceFee ?? pricingConfig.capiServiceFeeRate;

    const baselineCapiSpend = avgMonthlyCapiCampaigns * avgCampaignSpend;
    const capiEligibleSpend = baselineCapiSpend * capiLineItemShare;
    const capiLaborSavings = OPERATIONAL_BENCHMARKS.MANUAL_LABOR_HOURS_SAVED * OPERATIONAL_BENCHMARKS.HOURLY_RATE;

    const conversionImprovement = CAPI_CAMPAIGN_VALUES.CONVERSION_RATE_MULTIPLIER - 1;
    const improvedCapiEligibleSpend = capiEligibleSpend * (1 + conversionImprovement);
    const conversionTrackingRevenue = capiEligibleSpend * conversionImprovement;
    const campaignServiceFees = improvedCapiEligibleSpend * serviceFee;

    const deploymentMultiplier = this.getDeploymentMultiplier(scenario.deployment);
    const monthlyUplift = (conversionTrackingRevenue + capiLaborSavings - campaignServiceFees) * deploymentMultiplier;
    const annualUplift = monthlyUplift * 12;

    const NET_NEW_CAMPAIGN_RATE = 0.80;
    const netNewCampaignRevenue = baselineCapiSpend * NET_NEW_CAMPAIGN_RATE;

    return {
      matchRateImprovement,
      baselineCapiSpend,
      capiEligibleSpend,
      totalCapiSpendWithImprovement: baselineCapiSpend + conversionTrackingRevenue,
      conversionTrackingRevenue,
      campaignServiceFees,
      capiLaborSavings,
      monthlyUplift,
      annualUplift,
      details: {
        baselineMatchRate: baselineMatchRate * 100,
        improvedMatchRate: improvedMatchRate * 100,
        conversionImprovement: conversionImprovement * 100,
        ctrImprovement: (CAPI_BENCHMARKS.CTR_MULTIPLIER - 1) * 100,
      },
      capiConfiguration: capiConfig,
      netNewCampaignRevenue,
      netNewCampaignRate: NET_NEW_CAMPAIGN_RATE,
    };
  }

  private static calculateMediaPerformance(
    monthlyPageviews: number,
    displayCPM: number,
    videoCPM: number,
    displayVideoSplit: number,
    scenario: ScenarioState,
    currentMonthlyRevenue: number,
    displayImpressions: number,
    videoImpressions: number,
    overrides?: AssumptionOverrides,
  ) {
    const premiumInventoryShare = overrides?.premiumInventoryShare ?? MEDIA_PERFORMANCE_BENCHMARKS.PREMIUM_INVENTORY_SHARE;
    const yieldUplift = overrides?.premiumYieldUplift ?? MEDIA_PERFORMANCE_BENCHMARKS.YIELD_UPLIFT_PERCENTAGE;

    const premiumDisplayImpressions = displayImpressions * premiumInventoryShare;
    const premiumVideoImpressions = videoImpressions * premiumInventoryShare;

    const displayPremiumUplift = (premiumDisplayImpressions / 1000) * displayCPM * yieldUplift;
    const videoPremiumUplift = (premiumVideoImpressions / 1000) * videoCPM * yieldUplift;
    const premiumPricingPower = displayPremiumUplift + videoPremiumUplift;

    const directSoldRevenue = currentMonthlyRevenue * MEDIA_PERFORMANCE_BENCHMARKS.DIRECT_SOLD_INVENTORY_SHARE;
    const baselineMakeGoods = directSoldRevenue * MEDIA_PERFORMANCE_BENCHMARKS.BASELINE_MAKEGOOD_RATE;
    const improvedMakeGoods = directSoldRevenue * MEDIA_PERFORMANCE_BENCHMARKS.IMPROVED_MAKEGOOD_RATE;
    const makeGoodSavings = baselineMakeGoods - improvedMakeGoods;

    const baselineROAS = MEDIA_PERFORMANCE_BENCHMARKS.BASELINE_ROAS;
    const improvedROAS = MEDIA_PERFORMANCE_BENCHMARKS.IMPROVED_ROAS;
    const roasImprovement = ((improvedROAS - baselineROAS) / baselineROAS) * 100;

    const deploymentMultiplier = this.getDeploymentMultiplier(scenario.deployment);
    const monthlyUplift = (premiumPricingPower + makeGoodSavings) * deploymentMultiplier;
    const annualUplift = monthlyUplift * 12;

    return {
      advertiserROASImprovement: roasImprovement,
      makeGoodReduction: (MEDIA_PERFORMANCE_BENCHMARKS.BASELINE_MAKEGOOD_RATE - MEDIA_PERFORMANCE_BENCHMARKS.IMPROVED_MAKEGOOD_RATE) * 100,
      premiumPricingPower,
      monthlyUplift,
      annualUplift,
      details: {
        baselineROAS,
        improvedROAS,
        baselineMakeGoodRate: MEDIA_PERFORMANCE_BENCHMARKS.BASELINE_MAKEGOOD_RATE * 100,
        improvedMakeGoodRate: MEDIA_PERFORMANCE_BENCHMARKS.IMPROVED_MAKEGOOD_RATE * 100,
        makeGoodSavings,
        directSoldRevenue,
        directSoldShare: MEDIA_PERFORMANCE_BENCHMARKS.DIRECT_SOLD_INVENTORY_SHARE,
        premiumYieldMonthly: premiumPricingPower,
      },
    };
  }

  private static getDeploymentMultiplier(deployment: string): number {
    switch (deployment) {
      case 'single': return SCENARIO_MULTIPLIERS.DEPLOYMENT.SINGLE;
      case 'multi': return SCENARIO_MULTIPLIERS.DEPLOYMENT.MULTI;
      case 'full': return SCENARIO_MULTIPLIERS.DEPLOYMENT.FULL;
      default: return 1;
    }
  }

  private static calculatePricing(
    inputs: SimplifiedInputs,
    riskScenario: RiskScenario = 'moderate',
    overrides?: AssumptionOverrides,
    pricingConfig: PricingConfig = DEFAULT_PRICING,
  ): PricingModel {
    const capiConfig = this.calculateCapiConfiguration(riskScenario, overrides);

    const pocFlatFee = pricingConfig.pocFlatFee;
    const pocDurationMonths = pricingConfig.pocDurationMonths;
    const fullContractMonthly = effectiveContractMonthly(pricingConfig);
    const capiServiceFeeRate = pricingConfig.capiServiceFeeRate;

    const avgMonthlyCapiCampaigns = capiConfig.yearlyCampaigns / 12;
    const totalMonthlyCapiSpend = avgMonthlyCapiCampaigns * capiConfig.avgCampaignSpend;
    const monthlyCapiServiceFees = totalMonthlyCapiSpend * capiServiceFeeRate;

    return {
      pocFlatFee,
      pocDurationMonths,
      pocMonthlyEquivalent: pocFlatFee / pocDurationMonths,
      fullContractMonthly,
      capiServiceFeeRate,
      totalMonthlyCapiSpend,
      monthlyCapiServiceFees,
    };
  }

  private static calculateROI(totalMonthlyBenefits: number, pricing: PricingModel): ROIAnalysis {
    const platformFeePOC = pricing.pocMonthlyEquivalent;
    const pocPhaseTotalMonthlyCost = platformFeePOC;
    const platformFeeFull = pricing.fullContractMonthly;
    const fullContractTotalMonthlyCost = platformFeeFull;

    const pocPhaseNetMonthlyROI = totalMonthlyBenefits - pocPhaseTotalMonthlyCost;
    const pocPhaseNetAnnualROI = pocPhaseNetMonthlyROI * 12;
    const pocPhaseROIMultiple = pocPhaseTotalMonthlyCost > 0 ? totalMonthlyBenefits / pocPhaseTotalMonthlyCost : 0;

    const fullContractNetMonthlyROI = totalMonthlyBenefits - fullContractTotalMonthlyCost;
    const fullContractNetAnnualROI = fullContractNetMonthlyROI * 12;
    const fullContractROIMultiple = fullContractTotalMonthlyCost > 0 ? totalMonthlyBenefits / fullContractTotalMonthlyCost : 0;

    const pocPaybackMonths = totalMonthlyBenefits > 0 ? pricing.pocFlatFee / totalMonthlyBenefits : 999;
    const fullContractPaybackMonths = totalMonthlyBenefits > 0 ? platformFeeFull / totalMonthlyBenefits : 999;

    return {
      totalMonthlyBenefits,
      totalAnnualBenefits: totalMonthlyBenefits * 12,
      costs: {
        pocPhaseMonthly: pocPhaseTotalMonthlyCost,
        fullContractMonthly: fullContractTotalMonthlyCost,
        platformFeePOC,
        platformFeeFull,
        capiServiceFees: 0,
      },
      netMonthlyROI: { pocPhase: pocPhaseNetMonthlyROI, fullContract: fullContractNetMonthlyROI },
      netAnnualROI: { pocPhase: pocPhaseNetAnnualROI, fullContract: fullContractNetAnnualROI },
      roiMultiple: { pocPhase: pocPhaseROIMultiple, fullContract: fullContractROIMultiple },
      paybackMonths: { pocPhase: pocPaybackMonths, fullContract: fullContractPaybackMonths },
    };
  }

  static generateMonthlyProjection(results: UnifiedResults): MonthlyProjection[] {
    const { currentMonthlyRevenue, totalMonthlyUplift } = results.totals;
    const rampUpMonths = results.riskScenario ? RISK_SCENARIOS[results.riskScenario].rampUpMonths : 12;
    const { costs } = results.roiAnalysis;

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      let rampUpFactor = 1;
      if (rampUpMonths <= 6) {
        if (month <= 2) rampUpFactor = 0.30;
        else if (month <= 4) rampUpFactor = 0.60;
        else rampUpFactor = 1.0;
      } else if (rampUpMonths <= 12) {
        if (month <= 3) rampUpFactor = 0.25;
        else if (month <= 6) rampUpFactor = 0.50;
        else if (month <= 9) rampUpFactor = 0.75;
        else rampUpFactor = 1.0;
      } else {
        if (month <= 3) rampUpFactor = 0.15;
        else if (month <= 6) rampUpFactor = 0.30;
        else if (month <= 9) rampUpFactor = 0.50;
        else rampUpFactor = 0.70;
      }

      const monthlyUplift = totalMonthlyUplift * rampUpFactor;
      const projectedRevenue = currentMonthlyRevenue + monthlyUplift;
      const monthlyCost = month <= 3 ? costs.pocPhaseMonthly : costs.fullContractMonthly;
      const netROI = monthlyUplift - monthlyCost;
      const roiMultiple = monthlyCost > 0 ? monthlyUplift / monthlyCost : 0;

      return {
        month,
        monthLabel: `Month ${month}`,
        currentRevenue: currentMonthlyRevenue,
        projectedRevenue,
        uplift: monthlyUplift,
        rampUpFactor,
        netROI,
        roiMultiple,
      };
    });
  }
}
