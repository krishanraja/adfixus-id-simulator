import { useMemo, useRef } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { FramingHero } from './FramingHero';
import { HeroNumber } from './HeroNumber';
import { DomainPortfolio } from './DomainPortfolio';
import { BasicInputs } from './BasicInputs';
import { AdvancedPanel } from './AdvancedPanel';
import { ResultsSection } from './ResultsSection';
import { AdfixusLogo } from '@/components/brand/AdfixusLogo';
import { useIdSimulator, DEFAULTS } from '@/hooks/useIdSimulator';

const approxEq = (a: number, b: number) => Math.abs(a - b) < 0.0001;

type Simulator = ReturnType<typeof useIdSimulator>;

interface IdSimulatorProps {
  /**
   * Share a simulator instance from the guided flow so the audience size chosen
   * in the flow carries into the full picture (and vice-versa). When omitted,
   * the component owns its own state — the original standalone behaviour.
   */
  simulator?: Simulator;
  /**
   * When embedded inside the DepthDrawer the outer page chrome (sticky header,
   * the opening provocation) is redundant, so it is suppressed.
   */
  embedded?: boolean;
}

export const IdSimulator = ({ simulator, embedded = false }: IdSimulatorProps = {}) => {
  const owned = useIdSimulator();
  const {
    state,
    results,
    visibility,
    patch,
    patchReadiness,
    addDomain,
    updateDomain,
    removeDomain,
    reset,
  } = simulator ?? owned;

  const configureRef = useRef<HTMLElement>(null);

  const scrollToConfigure = () => {
    configureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    <div className={embedded ? 'bg-background' : 'min-h-dvh-safe bg-background'}>
      {!embedded && <AppHeader />}

      <main className="container mx-auto max-w-5xl px-4 pb-20 pt-4 md:pt-8">
        {/* 1. Framing — the AI-era provocation, made personal. Suppressed when
            embedded in the drawer (the guided flow has already provoked). */}
        {!embedded && <FramingHero visibility={visibility} onExplore={scrollToConfigure} />}

        {/* 2. See your own situation — the configurable inputs, framed as their business */}
        <section ref={configureRef} className={embedded ? 'scroll-mt-20' : 'mt-20 scroll-mt-20'}>
          <div className="mb-8 max-w-2xl">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
              Step 1 · Describe your business
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Let&rsquo;s ground this in your reality
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              A few inputs about your traffic and monetisation. Everything
              recalculates live — treat the sliders as a way to explore, not a
              form to complete. Nothing leaves your browser.
            </p>
          </div>

          <div className="space-y-6">
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
          </div>
        </section>

        {/* 3. The narrative result — how much is invisible, what durable ID recovers */}
        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
                Step 2 · What durable identity recovers
              </div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Here&rsquo;s what you&rsquo;re leaving in the dark
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Your anonymous majority isn&rsquo;t lost — it&rsquo;s unrecognised.
                A durable, first-party identity you own re-recognises returning
                humans past the cookie window, so more of your real audience
                becomes addressable and measurable again.
              </p>
            </div>
            <button
              onClick={reset}
              className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Reset all
            </button>
          </div>

          {/* Animated headline */}
          <div className="animate-fade-in">
            <HeroNumber
              annualUplift={results.totals.totalAnnualUplift}
              monthlyUplift={results.totals.totalMonthlyUplift}
              threeYear={results.totals.threeYearProjection}
              percentImprovement={results.totals.percentageImprovement}
              visibility={visibility}
            />
          </div>

          <div className="mt-8">
            <ResultsSection results={results} state={state} visibility={visibility} />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center gap-3 border-t border-border/50 pt-8 text-center">
          <AdfixusLogo height={22} />
          <p className="max-w-xl text-xs text-muted-foreground">
            Figures are directional estimates based on industry benchmarks and your inputs, not a
            commercial offer. Everything is modelled entirely in your browser.
          </p>
        </footer>
      </main>
    </div>
  );
};
