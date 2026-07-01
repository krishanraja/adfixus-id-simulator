// AdFixus core — dependency-free golden-values self-check.
//
// Guarantees the shared engine produces identical numbers in every repo.
// This file is vendored identically into all three tools. To run it:
//
//   npx esbuild src/core/selfcheck.ts --bundle --platform=node --format=cjs \
//     --outfile=/tmp/afx-selfcheck.cjs && node /tmp/afx-selfcheck.cjs
//
// Exits non-zero if any golden value drifts. Golden values were hand-verified
// against the original Vox engine (see docs/ADFIXUS_CORE_SPEC.md § Golden values).
import { calculateIdDurability, calculateCapiBenefits } from './engine/index';

interface Check { label: string; got: number; want: number; tol: number; }

const SITE = {
  monthlyPageviews: 5_000_000,
  displayCPM: 4.5,
  videoCPM: 12,
  adsPerPage: 3.2,
  displayVideoSplit: 80,
  safariShare: 0.35,
};

const id = calculateIdDurability(SITE); // scope id-only, moderate risk
const capi = calculateCapiBenefits(SITE); // scope id-capi, moderate risk

const checks: Check[] = [
  { label: 'current monthly revenue', got: Math.round(id.totals.currentMonthlyRevenue), want: 96000, tol: 1 },
  { label: 'ID-only monthly uplift', got: Math.round(id.idInfrastructure.monthlyUplift), want: 5298, tol: 2 },
  { label: 'improved addressability %', got: Math.round(id.idInfrastructure.details.improvedAddressability * 10) / 10, want: 77.3, tol: 0.2 },
  { label: 'CDP monthly savings', got: id.idInfrastructure.details.monthlyCdpSavings, want: 3500, tol: 0 },
  { label: 'CAPI monthly uplift (id-capi)', got: Math.round(capi.capiCapabilities!.monthlyUplift), want: 6488, tol: 3 },
];

let failed = 0;
for (const c of checks) {
  const ok = Math.abs(c.got - c.want) <= c.tol;
  if (!ok) failed++;
  // eslint-disable-next-line no-console
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.label}: got ${c.got}, want ${c.want} (±${c.tol})`);
}

if (failed > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n${failed} golden value(s) drifted — the engine math changed.`);
  (globalThis as { process?: { exit?: (code: number) => void } }).process?.exit?.(1);
} else {
  // eslint-disable-next-line no-console
  console.log('\nAll AdFixus core golden values OK.');
}

export {};
