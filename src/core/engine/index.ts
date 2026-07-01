// AdFixus core - public engine API.
//
// The simulator UI (`src/hooks/useIdSimulator.ts`) drives the engine directly
// via `UnifiedCalculationEngine.calculate(...)`. This barrel re-exports the
// engine, the domain aggregator, and every benchmark/type it needs so the app
// can `import { ... } from '@/core'`.

export { UnifiedCalculationEngine } from './unifiedCalculationEngine';
export { aggregateDomainInputs } from './domainAggregation';
export * from '../constants/benchmarks';
export * from '../constants/riskScenarios';
export * from '../constants/readinessFactors';
export * from '../constants/pricingConfig';
export * from '../types/scenarios';
export * from '../types/domain';
