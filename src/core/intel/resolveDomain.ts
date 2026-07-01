// Turn whatever a visitor types ("https://www.KBB.com/reviews", "theguardian.com")
// into a tailored business profile - entirely client-side, no network required.
//
// Resolution order:
//   1. Normalise to a registrable domain.
//   2. Exact match against KNOWN_COMPANIES (real AdFixus research accounts).
//   3. Keyword heuristics on the domain to infer a vertical.
//   4. Fall back to a generic open-web publisher.

import {
  VERTICALS,
  DEFAULT_VERTICAL,
  type Vertical,
  type VerticalArchetype,
  type Sophistication,
} from './verticals';
import { KNOWN_COMPANIES, DOMAIN_TO_COMPANY, type KnownCompany } from './knownDomains';

export type MatchKind = 'known' | 'heuristic' | 'default';

export interface DomainProfile {
  /** Exactly what the visitor typed. */
  raw: string;
  /** Normalised registrable domain, or null if nothing usable was entered. */
  domain: string | null;
  /** Display name - the real company when known, else a tidy version of the domain. */
  company: string;
  vertical: Vertical;
  archetype: VerticalArchetype;
  /** Anonymous audience share, %. */
  anonPct: number;
  tranco: number | null;
  sophistication: Sophistication | null;
  /** The identity gap - the specific research note when known, else the archetype's. */
  identityGap: string;
  /** The AdFixus hook for this specific account, when we have one. */
  angle: string | null;
  /** How confident the match is. */
  match: MatchKind;
  /** The underlying research record, when the domain is a known account. */
  known: KnownCompany | null;
}

// Second-level domains that sit under a country code (so we keep three labels).
const MULTI_LABEL_SLD = new Set([
  'co.uk', 'com.au', 'co.nz', 'co.jp', 'com.br', 'co.za',
  'co.in', 'org.uk', 'net.au', 'com.sg', 'co.id',
]);

/** Strip scheme/path/query and a leading www., lower-case the host. */
export function normalizeHost(input: string): string | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z]+:\/\//, ''); // scheme
  s = s.split(/[/?#]/)[0]; // path/query/hash
  s = s.replace(/^www\./, '');
  s = s.replace(/:\d+$/, ''); // port
  s = s.trim();
  // Reject obvious non-domains (no dot, or contains spaces/@).
  if (!s || s.includes(' ') || s.includes('@') || !s.includes('.')) return null;
  // Must look like a hostname.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return null;
  return s;
}

/** Reduce a host to its registrable domain (example.co.uk, not news.example.co.uk). */
export function registrableDomain(host: string): string {
  const parts = host.split('.');
  if (parts.length >= 3 && MULTI_LABEL_SLD.has(parts.slice(-2).join('.'))) {
    return parts.slice(-3).join('.');
  }
  if (parts.length >= 2) return parts.slice(-2).join('.');
  return host;
}

/** Title-case a domain's root label for display when we don't know the brand. */
function prettyName(domain: string): string {
  const root = domain.split('.')[0].replace(/[-_]+/g, ' ');
  return root
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Keyword → vertical heuristics. Ordered: the first vertical whose patterns hit
// the domain wins, so more specific signals are listed first.
const HEURISTICS: { vertical: Vertical; patterns: RegExp }[] = [
  {
    vertical: 'classifieds',
    patterns:
      /(auto|cars?|motor|vehicle|realestate|realtor|property|properti|homes?|estate|rent|classified|listing|marketplace|jobs?|career|travel|trip|flight|hotel|booking|kbb|autotrader|zillow|carsales|domain|tripadvisor)/,
  },
  {
    vertical: 'broadcast',
    patterns:
      /(tv|watch|stream|studios?|broadcast|channel|network|peacock|hulu|iplayer|televisi|cinema|video)/,
  },
  {
    vertical: 'entertainment',
    patterns:
      /(game|gaming|gamer|ign|fandom|wiki|anime|manga|music|vevo|lyric|celeb|movie|film|entertain|meme|comic)/,
  },
  {
    vertical: 'b2b',
    patterns:
      /(b2b|trade|industry|industr|tech|verge|wired|cnet|zdnet|techcrunch|adexchanger|adweek|marketing|enterprise|saas|biz|supplychain|logistics|construction|manufactur)/,
  },
  {
    vertical: 'lifestyle',
    patterns:
      /(sport|nba|nfl|nhl|mlb|golf|soccer|football|tennis|athlet|health|med|medic|wellness|fit|diet|nutrition|beauty|fashion|style|food|recipe|cook|home|garden|travel|parent|lifestyle)/,
  },
  {
    vertical: 'localnews',
    patterns: /(patch|local|gazette|dispatch|advertiser|examiner|sentinel|bugle)/,
  },
  {
    vertical: 'news',
    patterns:
      /(news|times|post|herald|tribune|guardian|journal|daily|chronicle|reuters|press|report|wire|finance|money|invest|market|bank|stock|crypto|fool|forbes|bloomberg|wsj|economist|business|politico)/,
  },
];

function classifyByKeyword(domain: string): Vertical | null {
  for (const { vertical, patterns } of HEURISTICS) {
    if (patterns.test(domain)) return vertical;
  }
  return null;
}

/** The generic profile used when nothing usable was entered. */
export function emptyProfile(raw = ''): DomainProfile {
  const archetype = VERTICALS[DEFAULT_VERTICAL];
  return {
    raw,
    domain: null,
    company: 'Your business',
    vertical: DEFAULT_VERTICAL,
    archetype,
    anonPct: archetype.seeds.anonPct,
    tranco: null,
    sophistication: null,
    identityGap: archetype.identityGap,
    angle: null,
    match: 'default',
    known: null,
  };
}

/** Resolve a typed domain into a tailored business profile. */
export function resolveDomainProfile(input: string): DomainProfile {
  const raw = (input ?? '').trim();
  const host = normalizeHost(raw);
  if (!host) return emptyProfile(raw);

  const domain = registrableDomain(host);

  // 1. Known research account (exact registrable-domain match).
  const knownIdx = DOMAIN_TO_COMPANY[domain];
  if (knownIdx !== undefined) {
    const known = KNOWN_COMPANIES[knownIdx];
    const archetype = VERTICALS[known.vertical];
    return {
      raw,
      domain,
      company: known.company,
      vertical: known.vertical,
      archetype,
      anonPct: known.anonPct ?? archetype.seeds.anonPct,
      tranco: known.tranco,
      sophistication: known.sophistication,
      identityGap: known.identityGap ?? archetype.identityGap,
      angle: known.angle,
      match: 'known',
      known,
    };
  }

  // 2. Heuristic classification.
  const guessed = classifyByKeyword(domain);
  const vertical = guessed ?? DEFAULT_VERTICAL;
  const archetype = VERTICALS[vertical];
  return {
    raw,
    domain,
    company: prettyName(domain),
    vertical,
    archetype,
    anonPct: archetype.seeds.anonPct,
    tranco: null,
    sophistication: null,
    identityGap: archetype.identityGap,
    angle: null,
    match: guessed ? 'heuristic' : 'default',
    known: null,
  };
}
