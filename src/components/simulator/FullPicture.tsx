import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Download,
  Gauge,
  Loader2,
  Rocket,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import { downloadIdProposalPdf } from '@/utils/idPdf';
import { MEETING_BOOKING_URL } from '@/config';
import { DomainPortfolio } from './DomainPortfolio';
import { BasicInputs } from './BasicInputs';
import { AddressabilityWaterfall } from './results/AddressabilityWaterfall';
import { DisplayVideoBreakdown } from './results/DisplayVideoBreakdown';
import { RampChart } from './results/RampChart';
import { TailoredBriefing } from '@/components/flow/TailoredBriefing';
import { type useIdSimulator } from '@/hooks/useIdSimulator';
import {
  OPPORTUNITY_META,
  ROLLOUT_PRESETS,
  opportunityAssumption,
  rolloutAssumption,
  type OpportunityKey,
  type RolloutKey,
} from '@/core/constants/scenarioPresets';
import type { UnifiedResults } from '@/core';
import type { DomainProfile } from '@/core/intel';

type Simulator = ReturnType<typeof useIdSimulator>;

interface FullPictureProps {
  /** The shared simulator instance from the guided flow (live state + results). */
  simulator: Simulator;
  /** The resolved domain profile; unlocks the tailored briefing tab when recognised. */
  profile?: DomainProfile;
}

type TabKey = 'configure' | 'finetune' | 'breakdown' | 'ramp' | 'briefing';

/**
 * The no-scroll "full picture" console.
 *
 * Everything that used to live on one long scrolling page is reorganised into a
 * bounded, navigable surface that never scrolls the host page. On wide screens a
 * persistent result rail (the live annual value, headline metrics and both
 * calls-to-action) sits beside a tabbed explore pane; on narrow screens the rail
 * collapses into a compact payoff bar above the same tabs. The visitor moves
 * between Configure, Scenario, Breakdown, Ramp (and a tailored Briefing when we
 * recognised their business) - discovering anything they need without the page
 * ever scrolling. Every input updates the payoff live, so impact is always in
 * view.
 */
export const FullPicture = ({ simulator, profile }: FullPictureProps) => {
  const {
    state,
    results,
    visibility,
    patch,
    addDomain,
    updateDomain,
    removeDomain,
    setOpportunity,
    setRollout,
  } = simulator;
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<TabKey>('configure');

  // On a short viewport a tall tab (e.g. Readiness) can overflow; the console
  // scrolls within this bounded wrapper (the host page never scrolls). Reset it
  // to the top when switching tabs so a prior scroll position isn't inherited.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  // The payoff is shared by the desktop rail and the mobile bar, so the animated
  // count-up and PDF export live here and flow down to both.
  const animatedAnnual = useAnimatedNumber(results.totals.totalAnnualUplift);
  const [pdfLoading, setPdfLoading] = useState(false);
  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadIdProposalPdf(results);
    } catch (err) {
      console.error('[ID PDF] generation failed', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const payoff = {
    animated: animatedAnnual,
    monthly: results.totals.totalMonthlyUplift,
    threeYear: results.totals.threeYearProjection,
    percentImprovement: results.totals.percentageImprovement,
    addressablePct: Math.round(visibility.addressableWithAdfixus * 100),
    pdfLoading,
    onPdf: handlePdf,
  };

  // Short, capitalised rollout name for the Breakdown's realised-value line.
  const rolloutName =
    state.rolloutScenario.charAt(0).toUpperCase() + state.rolloutScenario.slice(1);

  const hasBriefing = Boolean(profile?.domain);

  const tabs = useMemo(() => {
    const base: { key: TabKey; label: string; icon: typeof Gauge }[] = [
      { key: 'configure', label: 'Configure', icon: Gauge },
      { key: 'finetune', label: 'Scenario', icon: SlidersHorizontal },
      { key: 'breakdown', label: 'Breakdown', icon: BarChart3 },
      { key: 'ramp', label: 'Ramp', icon: TrendingUp },
    ];
    if (hasBriefing) base.push({ key: 'briefing', label: 'Briefing', icon: Sparkles });
    return base;
  }, [hasBriefing]);

  // How far the scenario has drifted from the golden Balanced · Backed baseline.
  // The only things a user can now change here are the two scenario pickers.
  const modifiedCount = useMemo(() => {
    let n = 0;
    if (state.opportunityScenario !== 'balanced') n++;
    if (state.rolloutScenario !== 'backed') n++;
    return n;
  }, [state.opportunityScenario, state.rolloutScenario]);

  // Restore the Balanced · Backed baseline (also re-seeds the opportunity
  // assumptions, risk backbone and clears any readiness deviation).
  const resetAssumptions = () => {
    setOpportunity('balanced');
    setRollout('backed');
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      {/* Compact payoff bar - only on narrow screens (< lg), above the tabs. */}
      <PayoffBar {...payoff} results={results} className="flex-none lg:hidden" />

      {/* Bounded scroll region: content is top-anchored and content-height, so
          the grid row (and the rail) match the tallest column per tab. A tab
          taller than the frame scrolls here; the host page never scrolls. */}
      <div ref={scrollRef} className="scroll-contained min-h-0 flex-1 overflow-y-auto">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        {/* ── Explore pane ─────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col">
          {/* Tab strip */}
          <div className="flex flex-none items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Full picture sections"
              className="scroll-contained flex flex-nowrap items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-secondary/30 p-1"
            >
              {tabs.map(({ key, label, icon: Icon }) => {
                const active = key === tab;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(key)}
                    className={[
                      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.3)]'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {modifiedCount > 0 && (
              <button
                onClick={resetAssumptions}
                className="inline-flex flex-none items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span> ({modifiedCount})
              </button>
            )}
          </div>

          {/* Active panel (content-height; the outer wrapper owns any scroll) */}
          <div className="mt-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'configure' && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <DomainPortfolio
                      domains={state.domains}
                      onAdd={addDomain}
                      onUpdate={updateDomain}
                      onRemove={removeDomain}
                    />
                    <BasicInputs
                      displayCPM={state.displayCPM}
                      videoCPM={state.videoCPM}
                      onDisplayCPM={(v) => patch({ displayCPM: v })}
                      onVideoCPM={(v) => patch({ videoCPM: v })}
                    />
                  </div>
                )}

                {tab === 'finetune' && (
                  <FineTunePanel
                    state={state}
                    setOpportunity={setOpportunity}
                    setRollout={setRollout}
                  />
                )}

                {tab === 'breakdown' && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <AddressabilityWaterfall
                      results={results}
                      visibility={visibility}
                      rolloutName={rolloutName}
                    />
                    <DisplayVideoBreakdown results={results} state={state} />
                  </div>
                )}

                {tab === 'ramp' && (
                  <div className="space-y-4">
                    <RampChart results={results} />
                    <p className="px-1 text-sm leading-relaxed text-muted-foreground">
                      Durable identity is owned infrastructure - recognition and
                      value build month over month as more returning humans are
                      re-identified. It compounds; it doesn&rsquo;t switch on.
                    </p>
                  </div>
                )}

                {tab === 'briefing' && profile && <TailoredBriefing profile={profile} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Persistent result rail (wide screens only) ───────────────── */}
        <ResultRail {...payoff} results={results} className="hidden lg:flex" />
      </div>
      </div>
    </div>
  );
};

/* ── A scenario section header: icon, title, one honest line of context. ── */
const SectionHead = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

/* ── The pre-defined scenario picker: three situation cards, one active. ── */
type ScenarioChoice<K extends string> = { key: K; label: string; blurb: string };

function ScenarioPicker<K extends string>({
  options,
  active,
  onPick,
}: {
  options: ScenarioChoice<K>[];
  active: K;
  onPick: (key: K) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => {
        const isActive = o.key === active;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            aria-pressed={isActive}
            className={[
              'flex flex-col gap-1 rounded-xl border p-3 text-left transition-all',
              isActive
                ? 'border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]'
                : 'border-border bg-secondary/30 hover:border-primary/40',
            ].join(' ')}
          >
            <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
              {o.label}
            </span>
            <span className="text-xs leading-snug text-muted-foreground">{o.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── A read-only "what we assumed" caption under a scenario picker. Keeps the
      model transparent without re-introducing raw dials the user can't answer. */
const AssumptionNote = ({ text }: { text: string }) => (
  <p className="flex flex-wrap items-baseline gap-x-1.5 px-1 text-xs text-muted-foreground">
    <span className="font-medium text-foreground/70">What we assumed:</span>
    <span>{text}</span>
  </p>
);

const OPPORTUNITY_CHOICES: ScenarioChoice<OpportunityKey>[] = (
  Object.keys(OPPORTUNITY_META) as OpportunityKey[]
).map((k) => ({ key: k, label: OPPORTUNITY_META[k].label, blurb: OPPORTUNITY_META[k].blurb }));

const ROLLOUT_CHOICES: ScenarioChoice<RolloutKey>[] = (
  Object.keys(ROLLOUT_PRESETS) as RolloutKey[]
).map((k) => ({ key: k, label: ROLLOUT_PRESETS[k].label, blurb: ROLLOUT_PRESETS[k].blurb }));

/* ── The scenario panel: the two questions a publisher can actually reason
      about - how ambitious to be, and how they'll execute. Each is a preset
      picker with a plain read-only "what we assumed" line; no raw dials. ─── */
type FineTunePanelProps = {
  state: Simulator['state'];
  setOpportunity: Simulator['setOpportunity'];
  setRollout: Simulator['setRollout'];
};

const FineTunePanel = ({ state, setOpportunity, setRollout }: FineTunePanelProps) => (
  <div className="space-y-5">
    <p className="text-sm leading-relaxed text-muted-foreground">
      Pick the scenario that matches your business - the result updates live.
    </p>

    {/* ── How far to push ────────────────────────────────────────────────── */}
    <section className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
      <SectionHead
        icon={Target}
        title="How far do you want to push?"
        subtitle="We've benchmarked how much Apple audience a durable ID typically wins back and the premium it earns. Balanced is our defensible middle - choose how ambitious to be."
      />
      <ScenarioPicker
        options={OPPORTUNITY_CHOICES}
        active={state.opportunityScenario}
        onPick={setOpportunity}
      />
      <AssumptionNote text={opportunityAssumption(state.opportunityScenario)} />
    </section>

    {/* ── How you'll roll it out ─────────────────────────────────────────── */}
    <section className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
      <SectionHead
        icon={Rocket}
        title="How will you roll it out?"
        subtitle="How much of that upside you capture depends on your team and timeline. Pick the situation closest to yours."
      />
      <ScenarioPicker
        options={ROLLOUT_CHOICES}
        active={state.rolloutScenario}
        onPick={setRollout}
      />
      <AssumptionNote text={rolloutAssumption(state.rolloutScenario)} />
    </section>
  </div>
);

/* ── Shared payoff props ────────────────────────────────────────────────── */
type PayoffProps = {
  animated: number;
  monthly: number;
  threeYear: number;
  percentImprovement: number;
  addressablePct: number;
  pdfLoading: boolean;
  onPdf: () => void;
  results: UnifiedResults;
  className?: string;
};

/* ── The persistent result rail: the payoff, always on screen (wide). ──── */
const ResultRail = ({
  animated,
  monthly,
  threeYear,
  percentImprovement,
  addressablePct,
  pdfLoading,
  onPdf,
  className = '',
}: PayoffProps) => (
  <aside
    className={`hero-gradient flex flex-col rounded-2xl border border-primary/20 bg-card/40 p-5 backdrop-blur-sm lg:p-6 ${className}`}
  >
    <div className="text-[11px] font-medium uppercase tracking-widest text-primary">
      What durable identity brings back
    </div>

    <div className="mt-3 flex items-start">
      <span className="text-4xl font-bold leading-none tracking-tight text-primary drop-shadow-[0_0_25px_hsl(var(--primary)/0.35)] tabular-nums xl:text-5xl">
        {formatCurrency(animated)}
      </span>
      <span className="ml-1.5 mt-1 text-lg font-normal text-muted-foreground">/yr</span>
    </div>

    <div className="mt-3">
      <span className="inline-flex rounded-full bg-revenue-gain/15 px-3 py-1 text-sm font-semibold text-revenue-gain">
        +{percentImprovement.toFixed(1)}% ad revenue uplift
      </span>
    </div>

    <dl className="mt-5 space-y-3 border-t border-border/50 pt-5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">Per month</dt>
        <dd className="font-semibold tabular-nums">{formatCurrency(monthly)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">Over 3 years</dt>
        <dd className="font-semibold tabular-nums">{formatCurrency(threeYear)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">Now addressable</dt>
        <dd className="font-semibold tabular-nums text-primary">~{formatPercentage(addressablePct, 0)}</dd>
      </div>
    </dl>

    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
      A live model of the returning humans a durable, owned identity re-recognises
      past the cookie window. Adjust anything on the left - this updates instantly.
    </p>

    <div className="mt-auto space-y-2.5 pt-5">
      <CtaBook />
      <CtaPdf loading={pdfLoading} onClick={onPdf} />
    </div>
  </aside>
);

/* ── The compact payoff bar: the same payoff, condensed (narrow). ──────── */
const PayoffBar = ({
  animated,
  monthly,
  threeYear,
  percentImprovement,
  addressablePct,
  pdfLoading,
  onPdf,
  className = '',
}: PayoffProps) => (
  <div
    className={`hero-gradient rounded-2xl border border-primary/20 bg-card/40 p-4 backdrop-blur-sm ${className}`}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-widest text-primary">
          What durable identity brings back
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-3xl font-bold leading-none tracking-tight text-primary tabular-nums">
            {formatCurrency(animated)}
          </span>
          <span className="text-sm text-muted-foreground">/yr</span>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-revenue-gain/15 px-2.5 py-1 text-xs font-semibold text-revenue-gain">
        +{percentImprovement.toFixed(1)}%
      </span>
    </div>

    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
      <span>{formatCurrency(monthly)}/mo</span>
      <span>{formatCurrency(threeYear)} / 3yr</span>
      <span className="text-primary">~{formatPercentage(addressablePct, 0)} addressable</span>
    </div>

    <div className="mt-3 flex gap-2">
      <CtaBook className="flex-1" compact />
      <CtaPdf loading={pdfLoading} onClick={onPdf} className="flex-1" compact />
    </div>
  </div>
);

const CtaBook = ({ className = '', compact = false }: { className?: string; compact?: boolean }) => (
  <a
    href={MEETING_BOOKING_URL}
    target="_blank"
    rel="noreferrer"
    className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.35)] transition-all hover:shadow-[0_0_45px_hsl(var(--primary)/0.55)] hover:brightness-110 active:scale-[0.98] ${className}`}
  >
    <CalendarCheck className="h-4 w-4 shrink-0" />
    {compact ? 'Book a call' : 'Book a conversation'}
    {!compact && (
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    )}
  </a>
);

const CtaPdf = ({
  loading,
  onClick,
  className = '',
  compact = false,
}: {
  loading: boolean;
  onClick: () => void;
  className?: string;
  compact?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border bg-secondary/40 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60 ${className}`}
  >
    {loading ? (
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
    ) : (
      <Download className="h-4 w-4 shrink-0" />
    )}
    {compact ? 'Summary' : 'Take the summary with you'}
  </button>
);
