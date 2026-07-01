// AdFixus core — public engine API.
//
// Re-exports the unified engine plus small convenience wrappers so the two
// lead magnets can get a benefits-only result from a handful of simple inputs
// without touching scenarios/pricing.
import { UnifiedCalculationEngine } from './unifiedCalculationEngine';
import { singleDomain } from '../types/domain';
import type { AssumptionOverrides, ScenarioState, UnifiedResults } from '../types/scenarios';
import type { RiskScenario } from '../constants/riskScenarios';

export { UnifiedCalculationEngine } from './unifiedCalculationEngine';
export { aggregateDomainInputs } from './domainAggregation';
export * from '../constants/benchmarks';
export * from '../constants/riskScenarios';
export * from '../constants/readinessFactors';
export * from '../constants/pricingConfig';
export * from '../types/scenarios';
export * from '../types/domain';

export interface SimpleSiteInputs {
  monthlyPageviews: number;
  displayCPM?: number;   // default 4.50
  videoCPM?: number;     // default 12.00
  adsPerPage?: number;   // default 2.0
  displayVideoSplit?: number; // default 80 (% display)
  safariShare?: number;  // 0-1, default 0.35
  capiLineItemShare?: number; // default 0.60
}

function buildInputs(p: SimpleSiteInputs) {
  return {
    domains: [
      singleDomain({
        monthlyPageviews: p.monthlyPageviews,
        adsPerPage: p.adsPerPage,
        displayVideoSplit: p.displayVideoSplit,
        safariShare: p.safariShare,
      }),
    ],
    displayCPM: p.displayCPM ?? 4.5,
    videoCPM: p.videoCPM ?? 12.0,
    capiLineItemShare: p.capiLineItemShare ?? 0.6,
  };
}

/**
 * ID durability benefits for a single site (id-simulator lead magnet).
 * Scope = 'id-only' → returns only ID-Infrastructure uplift (Safari
 * addressability recovery + CPM delta + CDP savings). No CAPI/media, no pricing.
 */
export function calculateIdDurability(
  p: SimpleSiteInputs,
  opts?: { deployment?: ScenarioState['deployment']; risk?: RiskScenario; overrides?: AssumptionOverrides },
): UnifiedResults {
  const scenario: ScenarioState = { deployment: opts?.deployment ?? 'single', scope: 'id-only' };
  return UnifiedCalculationEngine.calculate(buildInputs(p), scenario, opts?.risk ?? 'moderate', opts?.overrides);
}

/**
 * CAPI benefits on top of the ID for a single site (capi-calculator lead magnet).
 * Scope = 'id-capi' → read `.capiCapabilities` from the result for the CAPI story.
 */
export function calculateCapiBenefits(
  p: SimpleSiteInputs,
  opts?: { deployment?: ScenarioState['deployment']; risk?: RiskScenario; overrides?: AssumptionOverrides },
): UnifiedResults {
  const scenario: ScenarioState = { deployment: opts?.deployment ?? 'single', scope: 'id-capi' };
  return UnifiedCalculationEngine.calculate(buildInputs(p), scenario, opts?.risk ?? 'moderate', opts?.overrides);
}
