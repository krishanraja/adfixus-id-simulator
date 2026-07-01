// AdFixus core — aggregate metrics across one or more domains, weighted by
// pageview volume. Generalized: operates on generic CoreDomain[] passed in by
// the caller (no hardcoded portfolio).
import type { CoreDomain } from '../types/domain';

export interface AggregatedInputs {
  totalMonthlyPageviews: number;
  totalMonthlyImpressions: number;
  displayCPM: number;
  videoCPM: number;
  weightedDisplayVideoSplit: number;
  weightedSafariShare: number;
  weightedAdsPerPage: number;
  selectedDomains: CoreDomain[];
}

export const aggregateDomainInputs = (
  domainsInput: CoreDomain[],
  displayCPM = 4.5,
  videoCPM = 15.0,
  pageviewOverrides?: Record<string, number>,
  safariShareOverrides?: Record<string, number>,
): AggregatedInputs => {
  const domains = (domainsInput ?? []).map((d) => ({
    ...d,
    monthlyPageviews: pageviewOverrides?.[d.id] ?? d.monthlyPageviews,
    safariShare: safariShareOverrides?.[d.id] ?? d.safariShare,
  }));

  if (domains.length === 0) {
    return {
      totalMonthlyPageviews: 0,
      totalMonthlyImpressions: 0,
      displayCPM,
      videoCPM,
      weightedDisplayVideoSplit: 80,
      weightedSafariShare: 0.35,
      weightedAdsPerPage: 2.0,
      selectedDomains: [],
    };
  }

  const totalPageviews = domains.reduce((sum, d) => sum + d.monthlyPageviews, 0);
  const totalImpressions = domains.reduce((sum, d) => sum + d.monthlyPageviews * d.adsPerPage, 0);

  // Guard against divide-by-zero when all pageviews are 0.
  const weight = (fn: (d: CoreDomain) => number) =>
    totalPageviews > 0
      ? domains.reduce((sum, d) => sum + fn(d) * d.monthlyPageviews, 0) / totalPageviews
      : fn(domains[0]);

  return {
    totalMonthlyPageviews: totalPageviews,
    totalMonthlyImpressions: totalImpressions,
    displayCPM,
    videoCPM,
    weightedDisplayVideoSplit: weight((d) => d.displayVideoSplit),
    weightedSafariShare: weight((d) => d.safariShare),
    weightedAdsPerPage: weight((d) => d.adsPerPage),
    selectedDomains: domains,
  };
};
