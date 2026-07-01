// AdFixus core - Business Readiness factors that impact ROI realization.
import type { RiskScenario } from './riskScenarios';

export interface ReadinessFactors {
  salesReadiness: number;            // 0.5 = not trained, 1.0 = fully trained & incentivized
  technicalDeploymentMonths: number; // 3 = fast, 6 = normal, 12+ = slow
  advertiserBuyIn: number;           // 0.6 = skeptical, 0.8 = interested, 1.0 = committed
  organizationalOwnership: number;   // 0.6 = split ownership, 1.0 = dedicated owner
  marketConditions: number;          // 0.7 = cautious, 1.0 = growth mode
  trainingGaps: number;              // 0.5 = no plan, 1.0 = comprehensive training
  integrationDelays: number;         // 0.6 = many delays, 1.0 = on schedule
  resourceAvailability: number;      // 0.6 = shared resources, 1.0 = dedicated team
}

export const READINESS_PRESETS: Record<'conservative' | 'normal' | 'optimistic', ReadinessFactors> = {
  conservative: {
    salesReadiness: 0.5,
    technicalDeploymentMonths: 18,
    advertiserBuyIn: 0.6,
    organizationalOwnership: 0.6,
    marketConditions: 0.7,
    trainingGaps: 0.5,
    integrationDelays: 0.6,
    resourceAvailability: 0.6,
  },
  normal: {
    salesReadiness: 0.75,
    technicalDeploymentMonths: 12,
    advertiserBuyIn: 0.8,
    organizationalOwnership: 0.8,
    marketConditions: 0.85,
    trainingGaps: 0.75,
    integrationDelays: 0.8,
    resourceAvailability: 0.75,
  },
  optimistic: {
    salesReadiness: 1.0,
    technicalDeploymentMonths: 6,
    advertiserBuyIn: 1.0,
    organizationalOwnership: 1.0,
    marketConditions: 1.0,
    trainingGaps: 1.0,
    integrationDelays: 1.0,
    resourceAvailability: 1.0,
  },
};

export function readinessToRiskScenario(factors: ReadinessFactors): RiskScenario {
  const avgReadiness = (
    factors.salesReadiness +
    factors.advertiserBuyIn +
    factors.organizationalOwnership +
    factors.marketConditions +
    (factors.trainingGaps ?? 0.75) +
    (factors.integrationDelays ?? 0.8) +
    (factors.resourceAvailability ?? 0.75)
  ) / 7;

  if (avgReadiness >= 0.9) return 'optimistic';
  if (avgReadiness >= 0.7) return 'moderate';
  return 'conservative';
}

export const READINESS_DESCRIPTIONS = {
  salesReadiness: {
    title: 'Sales Team Readiness',
    description: 'Training, incentives, and active pipeline',
    tooltip: 'Are sellers trained on addressable products? Are incentives aligned? Do you have active RFPs for outcome-based campaigns?',
    low: '🔴 Not Trained', medium: '🟡 Basic Training', high: '🟢 Fully Enabled',
  },
  technicalDeploymentMonths: {
    title: 'Deployment Timeline',
    description: 'Time to full cross-domain deployment',
    tooltip: 'DNS setup, consent management, ad server config. Fast = 3mo, Normal = 6-12mo, Slow = 12+ mo.',
  },
  advertiserBuyIn: {
    title: 'Advertiser Adoption',
    description: 'Willingness to test CAPI & outcome-based buying',
    tooltip: 'Do advertisers trust publisher IDs? Are agencies onboarded? Can buyers ingest AdFixus IDs into their attribution?',
    low: '🔴 Skeptical', medium: '🟡 Interested', high: '🟢 Committed',
  },
  organizationalOwnership: {
    title: 'Project Ownership',
    description: 'Clear accountability and cross-functional alignment',
    tooltip: 'Is there a single owner? Are sales, tech, and data teams aligned? Do you have exec sponsorship?',
    low: '🔴 Split Teams', medium: '🟡 Shared Ownership', high: '🟢 Dedicated Owner',
  },
  marketConditions: {
    title: 'Budget Environment',
    description: 'Advertiser spending confidence and risk appetite',
    tooltip: 'Are advertisers in growth mode or cutting budgets? Is there confidence in new publisher tech investments?',
    low: '🔴 Cautious', medium: '🟡 Stable', high: '🟢 Growth Mode',
  },
  trainingGaps: {
    title: 'Training & Enablement',
    description: 'Comprehensive training plan for sales and operations',
    tooltip: 'Do you have a structured training program? Are there regular enablement sessions?',
    low: '🔴 No Training Plan', medium: '🟡 Basic Training', high: '🟢 Comprehensive Program',
  },
  integrationDelays: {
    title: 'Integration Delays',
    description: 'Potential delays from integrating with existing systems',
    tooltip: 'What timeline delays are expected from system integrations?',
    low: '🔴 Significant Delays', medium: '🟡 Minor Delays', high: '🟢 On Schedule',
  },
  resourceAvailability: {
    title: 'Resource Availability',
    description: 'Dedicated engineering and operational resources',
    tooltip: 'Do you have dedicated engineers for this project, or are resources shared?',
    low: '🔴 Shared Resources', medium: '🟡 Part-Time Dedication', high: '🟢 Dedicated Team',
  },
};
