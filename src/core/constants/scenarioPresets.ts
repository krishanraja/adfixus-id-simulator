// Publisher-facing scenario presets for the Fine-tune tab.
//
// These are TOOL-LOCAL product data, deliberately kept OUT of the shared
// calculation engine/constants so the core stays byte-identical across AdFixus
// tools. They translate two choices a publisher exec can actually make into the
// model inputs they otherwise couldn't know:
//
//   1. "The opportunity" - how ambitious the modelled CEILING is (the two
//      assumptions a publisher can't know: recovered-Safari % and CPM premium).
//   2. "Your rollout" - the real execution situation, which selects the risk
//      backbone (adoption/efficiency/realisation + ramp) and snaps the readiness
//      cards to a truthful neutral baseline.

import type { RiskScenario } from './riskScenarios';

export type OpportunityKey = 'cautious' | 'balanced' | 'ambitious';
export type RolloutKey = 'lean' | 'backed' | 'strategic';

/**
 * Sets the two upside assumptions the publisher can't know: how much of their
 * dark Apple/Safari audience a durable ID recovers, and the CPM premium it earns.
 *
 * `targetSafariAddressability` is the recovered fraction of the Apple slice. A
 * durable, owned ID re-recognises returning Apple/Safari users past the 7-day ITP
 * window, so recovery is near-complete; the levels express how much of that we
 * claim. At the default ~35% Apple share these lift TOTAL addressability from ~65%
 * to ~89% / ~95% / ~98% (see the Breakdown), which is the real AdFixus story.
 */
export const OPPORTUNITY_PRESETS: Record<
  OpportunityKey,
  { targetSafariAddressability: number; cpmUpliftFactor: number }
> = {
  cautious: { targetSafariAddressability: 0.7, cpmUpliftFactor: 0.15 },
  balanced: { targetSafariAddressability: 0.85, cpmUpliftFactor: 0.25 },
  ambitious: { targetSafariAddressability: 0.95, cpmUpliftFactor: 0.35 },
};

export const OPPORTUNITY_META: Record<OpportunityKey, { label: string; blurb: string }> = {
  cautious: { label: 'Cautious', blurb: 'Under-promise - a floor you can beat.' },
  balanced: { label: 'Balanced', blurb: 'A defensible middle estimate.' },
  ambitious: { label: 'Ambitious', blurb: 'What a strong programme can reach.' },
};

/** Situation-framed rollout scenarios. Each selects a risk backbone; the readiness
 *  overrides are cleared so the estimate is the pure backbone (no double-count). */
export const ROLLOUT_PRESETS: Record<
  RolloutKey,
  { risk: RiskScenario; label: string; blurb: string }
> = {
  lean: {
    risk: 'conservative',
    label: 'Lean team, prove ROI fast',
    blurb: 'A small crew shipping alongside the day job - you need a quick, defensible win before committing more.',
  },
  backed: {
    risk: 'moderate',
    label: 'Backed rollout with a dedicated owner',
    blurb: 'One clear owner, sales and ad-ops aligned, a normal enterprise timeline.',
  },
  strategic: {
    risk: 'optimistic',
    label: 'Strategic priority, resourced to move',
    blurb: 'Exec-sponsored and staffed - the org is set up to reach full value quickly.',
  },
};

/** The full-deployment horizon (months) each rollout implies - drives the ramp
 *  curve and feeds the read-only "what we assumed" line under the rollout picker. */
export const ROLLOUT_RAMP_MONTHS: Record<RolloutKey, number> = {
  lean: 12,
  backed: 9,
  strategic: 6,
};

/** A few plain words describing each rollout's execution posture. */
const ROLLOUT_SUMMARY: Record<RolloutKey, string> = {
  lean: 'small team, prove it first',
  backed: 'dedicated owner, aligned teams',
  strategic: 'exec-sponsored, fully resourced',
};

/**
 * Read-only one-line summaries of what each preset assumes, shown under the
 * scenario pickers so the model stays transparent without exposing raw dials.
 * Derived from the preset numbers, so the copy can never drift from the math.
 */
export function opportunityAssumption(key: OpportunityKey): string {
  const p = OPPORTUNITY_PRESETS[key];
  return `~${Math.round(p.targetSafariAddressability * 100)}% of your Apple audience re-recognised · +${Math.round(
    p.cpmUpliftFactor * 100,
  )}% CPM premium`;
}

export function rolloutAssumption(key: RolloutKey): string {
  return `${ROLLOUT_RAMP_MONTHS[key]}-month rollout · ${ROLLOUT_SUMMARY[key]}`;
}

/**
 * Per-factor readiness values that produce a NEUTRAL (x1.0) engine multiplier.
 * A rollout sends NO readiness override (pure backbone); these are the honest
 * baseline the cards DISPLAY, so nudging a card is a real deviation from neutral
 * rather than double-counting friction the backbone already prices in.
 *
 * Derived from the engine's readiness formulas (see unifiedCalculationEngine):
 *   salesReadiness   0.4 + x*0.8 = 1  -> 0.75
 *   advertiserBuyIn  0.5 + x*0.7 = 1  -> 0.7143
 *   trainingGaps     0.5 + x*0.6 = 1  -> 0.8333
 *   the four "friction-only" factors multiply by x directly -> neutral at 1.0
 */
export const NEUTRAL_READINESS = {
  salesReadiness: 0.75,
  advertiserBuyIn: 0.7143,
  trainingGaps: 0.8333,
  organizationalOwnership: 1.0,
  marketConditions: 1.0,
  integrationDelays: 1.0,
  resourceAvailability: 1.0,
} as const;
