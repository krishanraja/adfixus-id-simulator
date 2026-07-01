// State + engine bridge for the ID Durability Simulator.
//
// Holds all configurable inputs (portfolio of domains, CPMs, risk scenario, and
// a rich set of assumption overrides) and recomputes UnifiedResults live on any
// change via the vendored core engine.
//
// The engine reads a handful of ID-infrastructure benchmarks from mutable
// exported constant objects (Safari share, baseline addressability, CDP monthly
// savings). To keep those sliders truthful and live we snapshot the defaults
// once and re-apply the user's values around every calculate() call. Everything
// the engine accepts as a first-class override (target Safari addressability,
// CPM uplift factor, readiness factors) is passed through AssumptionOverrides.

import { useMemo, useState, useCallback } from 'react';
import {
  UnifiedCalculationEngine,
  ADDRESSABILITY_BENCHMARKS,
  OPERATIONAL_BENCHMARKS,
  singleDomain,
  type CoreDomain,
  type AssumptionOverrides,
  type ScenarioState,
  type UnifiedResults,
  type RiskScenario,
} from '@/core';

export interface DomainDraft {
  id: string;
  name: string;
  monthlyPageviews: number;
  adsPerPage: number;
  displayVideoSplit: number; // % display
  safariShare: number; // 0-1
}

export interface IdSimulatorState {
  domains: DomainDraft[];
  displayCPM: number;
  videoCPM: number;
  risk: RiskScenario;
  // ID-infrastructure assumptions (all live)
  safariShare: number; // 0-1, browser traffic share on Safari/iOS
  baselineAddressability: number; // 0-1, current total addressable inventory
  targetSafariAddressability: number; // 0-1, recovered Safari addressability
  cpmUpliftFactor: number; // 0-1, CPM boost on newly addressable inventory
  contextualCpmRatio: number; // 0-1, contextual CPM as a share of addressable CPM
  cdpMonthlySavings: number; // $/month CDP/data-platform saving
  readiness: {
    salesReadiness?: number;
    trainingGaps?: number;
    advertiserBuyIn?: number;
    organizationalOwnership?: number;
    marketConditions?: number;
    technicalDeploymentMonths?: number;
    integrationDelays?: number;
    resourceAvailability?: number;
  };
}

// Canonical defaults (mirror the core constants so "reset" is honest).
export const DEFAULTS = {
  displayCPM: 4.5,
  videoCPM: 12.0,
  risk: 'moderate' as RiskScenario,
  safariShare: ADDRESSABILITY_BENCHMARKS.SAFARI_SHARE, // 0.35
  baselineAddressability: ADDRESSABILITY_BENCHMARKS.BASELINE_TOTAL_ADDRESSABILITY, // 0.65
  targetSafariAddressability: ADDRESSABILITY_BENCHMARKS.TARGET_SAFARI_ADDRESSABILITY, // 0.35
  cpmUpliftFactor: ADDRESSABILITY_BENCHMARKS.CPM_IMPROVEMENT_FACTOR, // 0.25
  contextualCpmRatio: ADDRESSABILITY_BENCHMARKS.CONTEXTUAL_CPM_RATIO, // 0.72
  cdpMonthlySavings: OPERATIONAL_BENCHMARKS.CDP_MONTHLY_SAVINGS, // 3500
  adsPerPage: 2.0,
  displayVideoSplit: 80,
};

// Snapshot pristine constants so overrides are always relative to defaults.
const PRISTINE = {
  SAFARI_SHARE: ADDRESSABILITY_BENCHMARKS.SAFARI_SHARE,
  BASELINE_TOTAL_ADDRESSABILITY: ADDRESSABILITY_BENCHMARKS.BASELINE_TOTAL_ADDRESSABILITY,
  CONTEXTUAL_CPM_RATIO: ADDRESSABILITY_BENCHMARKS.CONTEXTUAL_CPM_RATIO,
  CDP_MONTHLY_SAVINGS: OPERATIONAL_BENCHMARKS.CDP_MONTHLY_SAVINGS,
};

let domainSeq = 0;
export function newDomain(partial?: Partial<DomainDraft>): DomainDraft {
  domainSeq += 1;
  return {
    id: `domain-${Date.now()}-${domainSeq}`,
    name: partial?.name ?? `Property ${domainSeq}`,
    monthlyPageviews: partial?.monthlyPageviews ?? 50_000_000,
    adsPerPage: partial?.adsPerPage ?? DEFAULTS.adsPerPage,
    displayVideoSplit: partial?.displayVideoSplit ?? DEFAULTS.displayVideoSplit,
    safariShare: partial?.safariShare ?? DEFAULTS.safariShare,
  };
}

const initialState = (): IdSimulatorState => ({
  domains: [newDomain({ name: 'Your site', monthlyPageviews: 50_000_000 })],
  displayCPM: DEFAULTS.displayCPM,
  videoCPM: DEFAULTS.videoCPM,
  risk: DEFAULTS.risk,
  safariShare: DEFAULTS.safariShare,
  baselineAddressability: DEFAULTS.baselineAddressability,
  targetSafariAddressability: DEFAULTS.targetSafariAddressability,
  cpmUpliftFactor: DEFAULTS.cpmUpliftFactor,
  contextualCpmRatio: DEFAULTS.contextualCpmRatio,
  cdpMonthlySavings: DEFAULTS.cdpMonthlySavings,
  readiness: {},
});

function deploymentFor(count: number): ScenarioState['deployment'] {
  if (count <= 1) return 'single';
  if (count <= 5) return 'multi';
  return 'full';
}

/**
 * Narrative framing metrics derived from the same state + engine results.
 *
 * These do NOT touch the engine - they translate the model's addressability
 * figures into the "how much of your audience is invisible today, and what a
 * durable owned identity recovers" story that leads the experience. Numbers are
 * evidence for the idea, not new inputs.
 */
export interface AudienceVisibility {
  monthlyPageviews: number;
  safariShare: number; // pageview-weighted, 0-1
  /** Share of the audience unaddressable today (going dark). */
  invisibleShare: number; // 0-1
  /** Share addressable today. */
  visibleShare: number; // 0-1
  /** Share a durable, owned ID recovers back into view. */
  recoveredShare: number; // 0-1 (of total audience)
  /** Share still invisible even after recovery. */
  stillInvisibleShare: number; // 0-1
}

export function deriveAudienceVisibility(
  state: IdSimulatorState,
  results: UnifiedResults,
): AudienceVisibility {
  const d = results.idInfrastructure.details;
  const monthlyPageviews = state.domains.reduce((s, dm) => s + dm.monthlyPageviews, 0);
  const totalPv = monthlyPageviews || 1;
  const safariShare =
    state.domains.reduce((s, dm) => s + dm.safariShare * dm.monthlyPageviews, 0) / totalPv;

  // Engine reports addressability as percentages (0-100).
  const visibleShare = Math.min(1, Math.max(0, d.currentAddressability / 100));
  const improvedShare = Math.min(1, Math.max(0, d.improvedAddressability / 100));
  const recoveredShare = Math.max(0, improvedShare - visibleShare);
  const invisibleShare = Math.max(0, 1 - visibleShare);
  const stillInvisibleShare = Math.max(0, 1 - improvedShare);

  return {
    monthlyPageviews,
    safariShare,
    invisibleShare,
    visibleShare,
    recoveredShare,
    stillInvisibleShare,
  };
}

/** Runs the core engine for the given state, applying constant overrides. */
export function computeResults(state: IdSimulatorState): UnifiedResults {
  // Apply live constant overrides around the calculation.
  ADDRESSABILITY_BENCHMARKS.SAFARI_SHARE = state.safariShare;
  ADDRESSABILITY_BENCHMARKS.BASELINE_TOTAL_ADDRESSABILITY = state.baselineAddressability;
  ADDRESSABILITY_BENCHMARKS.CONTEXTUAL_CPM_RATIO = state.contextualCpmRatio;
  OPERATIONAL_BENCHMARKS.CDP_MONTHLY_SAVINGS = state.cdpMonthlySavings;

  try {
    const domains: CoreDomain[] = state.domains.map((d) =>
      singleDomain({
        id: d.id,
        name: d.name,
        monthlyPageviews: d.monthlyPageviews,
        adsPerPage: d.adsPerPage,
        displayVideoSplit: d.displayVideoSplit,
        safariShare: d.safariShare,
      }),
    );

    const overrides: AssumptionOverrides = {
      targetSafariAddressability: state.targetSafariAddressability,
      cpmUpliftFactor: state.cpmUpliftFactor,
    };
    if (Object.keys(state.readiness).length > 0) {
      overrides.readinessFactors = state.readiness;
    }

    const scenario: ScenarioState = {
      deployment: deploymentFor(state.domains.length),
      scope: 'id-only',
    };

    return UnifiedCalculationEngine.calculate(
      {
        domains,
        displayCPM: state.displayCPM,
        videoCPM: state.videoCPM,
        capiLineItemShare: 0.6,
      },
      scenario,
      state.risk,
      overrides,
    );
  } finally {
    // Restore pristine constants so nothing leaks between renders / tools.
    ADDRESSABILITY_BENCHMARKS.SAFARI_SHARE = PRISTINE.SAFARI_SHARE;
    ADDRESSABILITY_BENCHMARKS.BASELINE_TOTAL_ADDRESSABILITY = PRISTINE.BASELINE_TOTAL_ADDRESSABILITY;
    ADDRESSABILITY_BENCHMARKS.CONTEXTUAL_CPM_RATIO = PRISTINE.CONTEXTUAL_CPM_RATIO;
    OPERATIONAL_BENCHMARKS.CDP_MONTHLY_SAVINGS = PRISTINE.CDP_MONTHLY_SAVINGS;
  }
}

export function useIdSimulator() {
  const [state, setState] = useState<IdSimulatorState>(initialState);

  const results = useMemo(() => computeResults(state), [state]);
  const visibility = useMemo(() => deriveAudienceVisibility(state, results), [state, results]);

  const patch = useCallback((partial: Partial<IdSimulatorState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const patchReadiness = useCallback((field: keyof IdSimulatorState['readiness'], value: number | undefined) => {
    setState((s) => {
      const readiness = { ...s.readiness };
      if (value === undefined) delete readiness[field];
      else readiness[field] = value;
      return { ...s, readiness };
    });
  }, []);

  const addDomain = useCallback(() => {
    setState((s) => ({ ...s, domains: [...s.domains, newDomain()] }));
  }, []);

  const updateDomain = useCallback((id: string, partial: Partial<DomainDraft>) => {
    setState((s) => ({
      ...s,
      domains: s.domains.map((d) => (d.id === id ? { ...d, ...partial } : d)),
    }));
  }, []);

  const removeDomain = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      domains: s.domains.length > 1 ? s.domains.filter((d) => d.id !== id) : s.domains,
    }));
  }, []);

  const reset = useCallback(() => setState(initialState()), []);

  return {
    state,
    results,
    visibility,
    patch,
    patchReadiness,
    addDomain,
    updateDomain,
    removeDomain,
    reset,
  };
}
