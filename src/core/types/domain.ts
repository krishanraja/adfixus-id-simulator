// AdFixus core - a generic publisher domain/property.
// Replaces the Vox-specific VoxDomain. Any tool constructs these from user
// input (a single property for the lead magnets, or many for a portfolio).

export interface CoreDomain {
  id: string;
  name: string;
  monthlyPageviews: number;
  displayVideoSplit: number; // 0-100, percentage sold as display (remainder video)
  adsPerPage: number;        // ad units rendered per pageview
  safariShare: number;       // 0-1, share of traffic on Safari/iOS
}

/** Build a single synthetic domain from simple inputs (used by lead magnets). */
export function singleDomain(params: {
  monthlyPageviews: number;
  adsPerPage?: number;
  displayVideoSplit?: number;
  safariShare?: number;
  name?: string;
  id?: string;
}): CoreDomain {
  return {
    id: params.id ?? 'primary',
    name: params.name ?? 'Your site',
    monthlyPageviews: params.monthlyPageviews,
    displayVideoSplit: params.displayVideoSplit ?? 80,
    adsPerPage: params.adsPerPage ?? 2.0,
    safariShare: params.safariShare ?? 0.35,
  };
}
