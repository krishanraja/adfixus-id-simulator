// Vertical archetypes for the identity-durability audit.
//
// The tool recognises a visitor's domain (see resolveDomain.ts) and tailors the
// whole experience around the *kind* of open-web business they run. Each vertical
// carries (a) sensible simulator input seeds so the model lands in the right
// ballpark before they touch a slider, and (b) the four-part narrative the
// AdFixus research playbook uses - context hook → identity gap → what it costs →
// how a publisher-owned durable ID solves it - plus a role-calibrated PROOF
// METRIC (Revenue / Ops / Data).
//
// Every proof figure here is a PUBLISHED AdFixus benchmark taken from the
// account-research playbook. No company-specific numbers are invented.

export type Vertical =
  | 'news'
  | 'broadcast'
  | 'lifestyle'
  | 'entertainment'
  | 'b2b'
  | 'classifieds'
  | 'localnews';

export type Sophistication =
  | 'greenfield'
  | 'light-stack'
  | 'vendor-stacked'
  | 'vendor-heavy'
  | 'in-house platform + vendors'
  | 'no-data';

/** The stakeholder the briefing is tuned for - mirrors the research playbook. */
export type StakeholderLens = 'revenue' | 'ops' | 'data';

export interface ProofPoint {
  /** The bold hero figure, e.g. "+25%" or "600k". */
  stat: string;
  /** What the figure measures. */
  statLabel: string;
  /** The industry benchmark a publisher will acknowledge. */
  benchmark: string;
  /** Attribution for the headline figure (kept honest - published proof only). */
  source: string;
}

/** Simulator input seeds - directional open-web benchmarks per vertical. */
export interface VerticalSeeds {
  safariShare: number; // 0-1
  displayVideoSplit: number; // % display
  displayCPM: number;
  videoCPM: number;
  adsPerPage: number;
  anonPct: number; // %
  /** Typical monthly pageviews, used as a starting point for the audience step. */
  monthlyPageviews: number;
}

export interface VerticalArchetype {
  key: Vertical;
  /** Human label, e.g. "News & finance publisher". */
  label: string;
  /** Lower-case noun phrase for inline copy, e.g. "news & finance site". */
  noun: string;
  seeds: VerticalSeeds;
  /** Hero hook grounded in this business's world (not the proof stat). */
  context: string;
  /** The identity gap (the wedge). */
  identityGap: string;
  /** What the gap is costing them today. */
  whatItCosts: string;
  /** How AdFixus's publisher-owned durable ID closes it. */
  adfixusMapping: string;
  /** Role-calibrated proof metric. */
  proof: Record<StakeholderLens, ProofPoint>;
}

// The three role proof metrics are shared across verticals (as they are in the
// research playbook), then a vertical may override a lens with its own published
// vertical proof (broadcaster Safari recovery, auto marketplace uplift).
const REVENUE_PROOF: ProofPoint = {
  stat: '+25%',
  statLabel: 'revenue uplift after deploying an addressable, publisher-owned identity',
  benchmark:
    'Publishers net only 50-67% of advertiser spend after adtech fees, versus 80-90% on owned or direct deals - and logged-in users are just 10-30% of the audience, so the anonymous majority is unaddressable today.',
  source: 'Carsales, post-deployment · addressable impressions also earn a 40-50% CPM uplift over anonymous',
};

const OPS_PROOF: ProofPoint = {
  stat: '100%',
  statLabel: 'Safari addressability recovered at go-live, with dark visitors recognised again',
  benchmark:
    '30-40%+ of web traffic (Safari, Firefox, ITP) is non-addressable and double-counted today, and every extra SSP in the header adds 50-100ms of latency.',
  source: 'A leading broadcaster surfaced 600k previously-invisible Safari users in six weeks',
};

const DATA_PROOF: ProofPoint = {
  stat: '+5-10%',
  statLabel: 'higher match rates into paid media, with 100% first-party match and zero PII',
  benchmark:
    "Rented ID-graph data is “photocopied” and decays within days, and first-party / PPID cookies purge under ITP - so match rates and ID durability collapse on the anonymous tier.",
  source: 'Patented double-encryption; the AFxID force-regenerates where a raw PPID purges',
};

const broadcasterOps: ProofPoint = {
  stat: '600k',
  statLabel: 'previously-invisible Safari users surfaced in six weeks by a leading broadcaster',
  benchmark:
    '30-40%+ of web traffic (Safari, Firefox, ITP) is non-addressable and double-counted today, and every extra SSP in the header adds 50-100ms of latency.',
  source: '100% addressability across impressions after go-live',
};

const autoRevenue: ProofPoint = {
  stat: '+25%',
  statLabel: 'revenue uplift, with 3× addressable impressions and 2× CTR on marketplace inventory',
  benchmark:
    'Publishers net only 50-67% of advertiser spend after adtech fees, versus 80-90% on owned or direct deals - and shopper audiences are ~95% anonymous.',
  source: 'Carsales, an auto marketplace, post-deployment',
};

export const VERTICALS: Record<Vertical, VerticalArchetype> = {
  news: {
    key: 'news',
    label: 'News & finance publisher',
    noun: 'news & finance site',
    seeds: {
      safariShare: 0.38,
      displayVideoSplit: 82,
      displayCPM: 4.5,
      videoCPM: 12,
      adsPerPage: 3,
      anonPct: 92,
      monthlyPageviews: 60_000_000,
    },
    context:
      'News and finance readers arrive in bursts - from search, social and AI answers - and most never log in. Programmatic display and video carry the P&L, so every impression you can actually recognise is worth defending as AI assistants answer more queries in place.',
    identityGap:
      'Your logged-in subscribers are a sliver; the durable-ID gap is the anonymous majority of readers, monetised on a rented, third-party stack that decays under Safari/ITP within days.',
    whatItCosts:
      'That majority is sold as low-value, contextual-only inventory or double-counted across SSPs - reach you can neither cap, measure, nor sell as premium first-party audience.',
    adfixusMapping:
      'AdFixus mints a publisher-owned, durable anonymous ID (AFxID) at the edge that survives Safari/ITP across browsers - turning anonymous readers into addressable, deduplicated, first-party audience you own outright, with no new vendor IDs.',
    proof: { revenue: REVENUE_PROOF, ops: OPS_PROOF, data: DATA_PROOF },
  },
  broadcast: {
    key: 'broadcast',
    label: 'Broadcaster / CTV',
    noun: 'broadcast & streaming business',
    seeds: {
      safariShare: 0.42,
      displayVideoSplit: 45,
      displayCPM: 6,
      videoCPM: 22,
      adsPerPage: 2,
      anonPct: 95,
      monthlyPageviews: 120_000_000,
    },
    context:
      'You have a rich logged-in graph inside the streaming app - but the anonymous web tier (news, sport, entertainment sites and AVOD front doors) is a different world, monetised on video and display where iOS traffic runs high and cookies barely survive.',
    identityGap:
      'The login/CTV graph sees authenticated viewers only. The gap is the anonymous majority of your web inventory - with no publisher-owned durable ID and no bridge between the CTV graph and the anonymous open web.',
    whatItCosts:
      'Premium video sits next to unrecognised, duplicated web reach; you can’t extend the CTV audience onto the web tier, so frequency, measurement and yield all leak.',
    adfixusMapping:
      'AdFixus extends your identity onto the anonymous web with a publisher-owned durable AFxID that persists across Safari/ITP - bridging the CTV graph and anonymous web inventory without adding rented vendor IDs.',
    proof: { revenue: REVENUE_PROOF, ops: broadcasterOps, data: DATA_PROOF },
  },
  lifestyle: {
    key: 'lifestyle',
    label: 'Lifestyle, health & sport',
    noun: 'lifestyle, health & sport network',
    seeds: {
      safariShare: 0.4,
      displayVideoSplit: 78,
      displayCPM: 5,
      videoCPM: 14,
      adsPerPage: 3.2,
      anonPct: 92,
      monthlyPageviews: 45_000_000,
    },
    context:
      'Lifestyle, health and sport audiences are huge, mobile-first and intent-rich - exactly the endemic first-party data advertisers pay a premium for. But most of that audience is anonymous, and on iOS it disappears from your view within days.',
    identityGap:
      'You have valuable contextual and interest signal, but no publisher-owned durable ID to attach it to across the anonymous majority - so the audience you could package as premium first-party segments stays unrecognised.',
    whatItCosts:
      'High-intent readers are sold as generic open exchange inventory; you forfeit the CPM premium and the clean-room/data-collaboration deals your first-party audience should command.',
    adfixusMapping:
      'AdFixus gives you a publisher-owned durable AFxID minted at the edge that survives Safari/ITP - turning anonymous, high-intent visitors into addressable first-party audience you can package, match and activate privacy-safely.',
    proof: { revenue: REVENUE_PROOF, ops: OPS_PROOF, data: DATA_PROOF },
  },
  entertainment: {
    key: 'entertainment',
    label: 'Entertainment & gaming',
    noun: 'entertainment & gaming platform',
    seeds: {
      safariShare: 0.45,
      displayVideoSplit: 70,
      displayCPM: 4,
      videoCPM: 15,
      adsPerPage: 3.5,
      anonPct: 95,
      monthlyPageviews: 80_000_000,
    },
    context:
      'Entertainment, fan and gaming audiences are enormous, young and highly engaged - and almost entirely anonymous. They come for the content, not to log in, and they skew to the mobile/iOS browsers where third-party identity dies fastest.',
    identityGap:
      'There’s often no durable identity layer on the dominant properties at all - the anonymous audience is monetised on context alone and decays in Safari/ITP, leaving the biggest, most passionate audience on the open web unaddressable.',
    whatItCosts:
      'A massive, high-frequency audience is monetised at contextual floors; you can’t cap frequency, build first-party segments, or turn fandom into a durable, ownable identity asset.',
    adfixusMapping:
      'AdFixus gives you a publisher-owned durable anonymous ID from day one - the first real identity layer, no vendor lock-in - turning anonymous fans into addressable, deduplicated first-party audience with immediate addressability uplift.',
    proof: { revenue: REVENUE_PROOF, ops: OPS_PROOF, data: DATA_PROOF },
  },
  b2b: {
    key: 'b2b',
    label: 'B2B & trade media',
    noun: 'B2B / trade publication',
    seeds: {
      safariShare: 0.3,
      displayVideoSplit: 85,
      displayCPM: 7,
      videoCPM: 18,
      adsPerPage: 2.5,
      anonPct: 88,
      monthlyPageviews: 15_000_000,
    },
    context:
      'Trade and B2B audiences are smaller but high-value - decision-makers advertisers pay a premium to reach. Much of the traffic is desktop and work-network, but the anonymous majority still decays under ITP, and account-level addressability is exactly what buyers want.',
    identityGap:
      'You run some third-party ID vendors, but no publisher-owned durable ID - so match rates are fragmented, the anonymous majority decays under Safari/ITP, and valuable professional audience leaks to the very vendors you pay.',
    whatItCosts:
      'Premium, hard-to-reach professional readers are under-recognised and under-monetised; you can’t reliably package or measure the account-level audience your advertisers most want.',
    adfixusMapping:
      'AdFixus consolidates rented vendor IDs into one publisher-owned durable AFxID that persists across Safari/ITP - better match durability across browsers, full ownership of the identity asset, and cleaner data for privacy-safe collaboration.',
    proof: { revenue: REVENUE_PROOF, ops: OPS_PROOF, data: DATA_PROOF },
  },
  classifieds: {
    key: 'classifieds',
    label: 'Marketplace & classifieds',
    noun: 'marketplace / classifieds business',
    seeds: {
      safariShare: 0.4,
      displayVideoSplit: 88,
      displayCPM: 3.5,
      videoCPM: 12,
      adsPerPage: 2.5,
      anonPct: 95,
      monthlyPageviews: 90_000_000,
    },
    context:
      'Auto, property, travel and jobs marketplaces run on enormous, high-intent shopper audiences that are ~95% anonymous. Listings and editorial are ad-monetised, and the shopper graph is the asset - but on the open web it’s rented, fragmented and Safari-fragile.',
    identityGap:
      'The shopper audience is anonymous and every identifier in the stack is rented or vendor-owned - no publisher-owned durable ID, so match is fragmented, Safari/ITP decays it, and data leaks to the vendors you pay.',
    whatItCosts:
      'Deep purchase intent is monetised at generic display floors and can’t be resolved into single shopper profiles - forfeiting both ad yield and the attribution your commercial teams want.',
    adfixusMapping:
      'AdFixus consolidates those rented IDs into one publisher-owned, durable anonymous ID minted at the edge - it persists across Safari/ITP, extends identity onto anonymous shopper traffic, and keeps the graph (and its value) inside your business.',
    proof: { revenue: autoRevenue, ops: OPS_PROOF, data: DATA_PROOF },
  },
  localnews: {
    key: 'localnews',
    label: 'Local & regional news',
    noun: 'local news network',
    seeds: {
      safariShare: 0.38,
      displayVideoSplit: 85,
      displayCPM: 3,
      videoCPM: 10,
      adsPerPage: 3.5,
      anonPct: 93,
      monthlyPageviews: 8_000_000,
    },
    context:
      'Local and regional news runs on thin margins and mostly anonymous, mobile readers. Programmatic display is the lifeblood, so recovering addressability on the anonymous majority is a direct line to the revenue that funds the newsroom.',
    identityGap:
      'A light identity stack and an anonymous, Safari-heavy readership mean most of your audience can’t be recognised past the cookie window - with no publisher-owned durable ID to hold onto returning readers.',
    whatItCosts:
      'Local inventory is sold at the lowest contextual floors and double-counted across SSPs, leaving real revenue - the kind that keeps reporters employed - on the table every month.',
    adfixusMapping:
      'AdFixus gives you a publisher-owned durable AFxID that survives Safari/ITP with a light edge integration - re-recognising returning local readers so more of your audience becomes addressable and premium, with no heavy engineering lift.',
    proof: { revenue: REVENUE_PROOF, ops: OPS_PROOF, data: DATA_PROOF },
  },
};

/** The generic open-web publisher fallback when a domain can't be classified. */
export const DEFAULT_VERTICAL: Vertical = 'news';

export const STAKEHOLDER_LENSES: { key: StakeholderLens; label: string; blurb: string }[] = [
  { key: 'revenue', label: 'Revenue', blurb: 'Incremental revenue, yield and CPM uplift' },
  { key: 'ops', label: 'Ad ops', blurb: 'Addressability, Safari/ITP recovery, dedup & latency' },
  { key: 'data', label: 'Data', blurb: 'Match rates, durability and owning the identity asset' },
];
