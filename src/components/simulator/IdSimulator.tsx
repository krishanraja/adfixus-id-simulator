import { useMemo } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { HeroNumber } from './HeroNumber';
import { DomainPortfolio } from './DomainPortfolio';
import { BasicInputs } from './BasicInputs';
import { AdvancedPanel } from './AdvancedPanel';
import { ResultsSection } from './ResultsSection';
import { AdfixusLogo } from '@/components/brand/AdfixusLogo';
import { useIdSimulator, DEFAULTS } from '@/hooks/useIdSimulator';

const approxEq = (a: number, b: number) => Math.abs(a - b) < 0.0001;

export const IdSimulator = () => {
  const { state, results, patch, patchReadiness, addDomain, updateDomain, removeDomain, reset } =
    useIdSimulator();

  const modifiedCount = useMemo(() => {
    let n = 0;
    if (!approxEq(state.safariShare, DEFAULTS.safariShare)) n++;
    if (!approxEq(state.baselineAddressability, DEFAULTS.baselineAddressability)) n++;
    if (!approxEq(state.targetSafariAddressability, DEFAULTS.targetSafariAddressability)) n++;
    if (!approxEq(state.cpmUpliftFactor, DEFAULTS.cpmUpliftFactor)) n++;
    if (!approxEq(state.contextualCpmRatio, DEFAULTS.contextualCpmRatio)) n++;
    if (!approxEq(state.cdpMonthlySavings, DEFAULTS.cdpMonthlySavings)) n++;
    n += Object.keys(state.readiness).length;
    return n;
  }, [state]);

  const resetAssumptions = () => {
    patch({
      safariShare: DEFAULTS.safariShare,
      baselineAddressability: DEFAULTS.baselineAddressability,
      targetSafariAddressability: DEFAULTS.targetSafariAddressability,
      cpmUpliftFactor: DEFAULTS.cpmUpliftFactor,
      contextualCpmRatio: DEFAULTS.contextualCpmRatio,
      cdpMonthlySavings: DEFAULTS.cdpMonthlySavings,
      readiness: {},
    });
  };

  return (
    <div className="min-h-dvh-safe bg-background">
      <AppHeader />

      <main className="container mx-auto max-w-5xl px-4 pb-20 pt-8 md:pt-10">
        {/* Intro */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            Durable identity ROI, modelled live
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            How much ad revenue is your{' '}
            <span className="gradient-text">unaddressable Safari traffic</span> costing you?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Enter your traffic and CPMs to see the recoverable revenue a durable AdFixus identity
            unlocks. Everything below recalculates instantly.
          </p>
        </div>

        {/* Hero number */}
        <div className="animate-fade-in">
          <HeroNumber
            annualUplift={results.totals.totalAnnualUplift}
            monthlyUplift={results.totals.totalMonthlyUplift}
            threeYear={results.totals.threeYearProjection}
            percentImprovement={results.totals.percentageImprovement}
          />
        </div>

        {/* Configure */}
        <section className="mt-8 space-y-6">
          <DomainPortfolio
            domains={state.domains}
            onAdd={addDomain}
            onUpdate={updateDomain}
            onRemove={removeDomain}
          />
          <BasicInputs
            displayCPM={state.displayCPM}
            videoCPM={state.videoCPM}
            risk={state.risk}
            onDisplayCPM={(v) => patch({ displayCPM: v })}
            onVideoCPM={(v) => patch({ videoCPM: v })}
            onRisk={(v) => patch({ risk: v })}
          />
          <AdvancedPanel
            state={state}
            patch={patch}
            patchReadiness={patchReadiness}
            onResetAll={resetAssumptions}
            modifiedCount={modifiedCount}
          />
        </section>

        {/* Results */}
        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold md:text-2xl">Your durability impact</h2>
            <button
              onClick={reset}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Reset all
            </button>
          </div>
          <ResultsSection results={results} state={state} />
        </section>

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center gap-3 border-t border-border/50 pt-8 text-center">
          <AdfixusLogo height={22} />
          <p className="max-w-xl text-xs text-muted-foreground">
            Figures are directional estimates based on industry benchmarks and your inputs, not a
            commercial offer. Calculations run entirely in your browser.
          </p>
        </footer>
      </main>
    </div>
  );
};
