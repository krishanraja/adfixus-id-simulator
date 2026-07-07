import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarCheck,
  Download,
  Gauge,
  Loader2,
  Radar,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import { downloadIdProposalPdf } from '@/utils/idPdf';
import { MEETING_BOOKING_URL } from '@/config';
import { DomainPortfolio } from './DomainPortfolio';
import { BasicInputs } from './BasicInputs';
import { AssumptionSlider } from './AssumptionSlider';
import { AddressabilityWaterfall } from './results/AddressabilityWaterfall';
import { DisplayVideoBreakdown } from './results/DisplayVideoBreakdown';
import { RampChart } from './results/RampChart';
import { TailoredBriefing } from '@/components/flow/TailoredBriefing';
import { DEFAULTS, type useIdSimulator } from '@/hooks/useIdSimulator';
import type { UnifiedResults } from '@/core';
import type { DomainProfile } from '@/core/intel';

type Simulator = ReturnType<typeof useIdSimulator>;

interface FullPictureProps {
  /** The shared simulator instance from the guided flow (live state + results). */
  simulator: Simulator;
  /** The resolved domain profile; unlocks the tailored briefing tab when recognised. */
  profile?: DomainProfile;
}

const approxEq = (a: number, b: number) => Math.abs(a - b) < 0.0001;
const pct = (v: number) => `${Math.round(v)}%`;

type TabKey = 'configure' | 'finetune' | 'breakdown' | 'ramp' | 'briefing';

/**
 * The no-scroll "full picture" console.
 *
 * Everything that used to live on one long scrolling page is reorganised into a
 * bounded, navigable surface that never scrolls the host page. On wide screens a
 * persistent result rail (the live annual value, headline metrics and both
 * calls-to-action) sits beside a tabbed explore pane; on narrow screens the rail
 * collapses into a compact payoff bar above the same tabs. The visitor moves
 * between Configure, Fine-tune, Breakdown, Ramp (and a tailored Briefing when we
 * recognised their business) - discovering anything they need without the page
 * ever scrolling. Every input updates the payoff live, so impact is always in
 * view.
 */
export const FullPicture = ({ simulator, profile }: FullPictureProps) => {
  const { state, results, visibility, patch, patchReadiness, addDomain, updateDomain, removeDomain } =
    simulator;
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<TabKey>('configure');

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
    recoveredPct: Math.round(visibility.recoveredShare * 100),
    pdfLoading,
    onPdf: handlePdf,
  };

  const hasBriefing = Boolean(profile?.domain);

  const tabs = useMemo(() => {
    const base: { key: TabKey; label: string; icon: typeof Gauge }[] = [
      { key: 'configure', label: 'Configure', icon: Gauge },
      { key: 'finetune', label: 'Fine-tune', icon: SlidersHorizontal },
      { key: 'breakdown', label: 'Breakdown', icon: BarChart3 },
      { key: 'ramp', label: 'Ramp', icon: TrendingUp },
    ];
    if (hasBriefing) base.push({ key: 'briefing', label: 'Briefing', icon: Sparkles });
    return base;
  }, [hasBriefing]);

  const modifiedCount = useMemo(() => {
    let n = 0;
    if (!approxEq(state.baselineAddressability, DEFAULTS.baselineAddressability)) n++;
    if (!approxEq(state.targetSafariAddressability, DEFAULTS.targetSafariAddressability)) n++;
    if (!approxEq(state.cpmUpliftFactor, DEFAULTS.cpmUpliftFactor)) n++;
    if (!approxEq(state.contextualCpmRatio, DEFAULTS.contextualCpmRatio)) n++;
    if (!approxEq(state.cdpMonthlySavings, DEFAULTS.cdpMonthlySavings)) n++;
    n += Object.keys(state.readiness).length;
    return n;
  }, [state]);

  const resetAssumptions = () =>
    patch({
      baselineAddressability: DEFAULTS.baselineAddressability,
      targetSafariAddressability: DEFAULTS.targetSafariAddressability,
      cpmUpliftFactor: DEFAULTS.cpmUpliftFactor,
      contextualCpmRatio: DEFAULTS.contextualCpmRatio,
      cdpMonthlySavings: DEFAULTS.cdpMonthlySavings,
      readiness: {},
    });

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      {/* Compact payoff bar - only on narrow screens (< lg), above the tabs. */}
      <PayoffBar {...payoff} results={results} className="flex-none lg:hidden" />

      <div className="grid min-h-0 min-w-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        {/* ── Explore pane ─────────────────────────────────────────────── */}
        <div className="flex min-h-0 min-w-0 flex-col">
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

          {/* Active panel */}
          <div className="scroll-contained mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="h-full"
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
                      risk={state.risk}
                      onDisplayCPM={(v) => patch({ displayCPM: v })}
                      onVideoCPM={(v) => patch({ videoCPM: v })}
                      onRisk={(v) => patch({ risk: v })}
                    />
                  </div>
                )}

                {tab === 'finetune' && <FineTunePanel state={state} patch={patch} patchReadiness={patchReadiness} />}

                {tab === 'breakdown' && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <AddressabilityWaterfall results={results} />
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
  );
};

/* ── The fine-tune panel: economics + readiness as compact sub-tabs so 14
      benchmark sliders stay no-scroll on wide screens. ─────────────────── */
type FineTunePanelProps = {
  state: Simulator['state'];
  patch: Simulator['patch'];
  patchReadiness: Simulator['patchReadiness'];
};

const FineTunePanel = ({ state, patch, patchReadiness }: FineTunePanelProps) => {
  const [group, setGroup] = useState<'economics' | 'readiness'>('economics');
  const r = state.readiness;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="mr-auto hidden text-sm text-muted-foreground sm:block">
          Every benchmark is yours to challenge - the result updates live.
        </p>
        <div className="ml-auto flex rounded-lg border border-border bg-secondary/30 p-0.5 sm:ml-0">
          {(
            [
              { key: 'economics', label: 'Economics', icon: Radar },
              { key: 'readiness', label: 'Readiness', icon: Briefcase },
            ] as const
          ).map(({ key, label, icon: Icon }) => {
            const active = key === group;
            return (
              <button
                key={key}
                onClick={() => setGroup(key)}
                aria-pressed={active}
                className={[
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {group === 'economics' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AssumptionSlider
            label="Baseline addressability"
            description="Share of total inventory addressable today"
            value={state.baselineAddressability * 100}
            defaultValue={DEFAULTS.baselineAddressability * 100}
            min={40}
            max={90}
            step={1}
            formatValue={pct}
            onChange={(v) => patch({ baselineAddressability: v / 100 })}
            tooltipContent="What fraction of impressions can currently be matched to an ID. The remainder is sold contextually at a discount."
          />
          <AssumptionSlider
            label="Recovered Safari addressability"
            description="Safari addressability restored by a durable ID"
            value={state.targetSafariAddressability * 100}
            defaultValue={DEFAULTS.targetSafariAddressability * 100}
            min={10}
            max={60}
            step={1}
            formatValue={pct}
            onChange={(v) => patch({ targetSafariAddressability: v / 100 })}
            tooltipContent="A durable ID re-identifies returning Safari users beyond the 7-day limit. A conservative target is ~35%."
          />
          <AssumptionSlider
            label="CPM uplift factor"
            description="Premium on newly addressable inventory"
            value={state.cpmUpliftFactor * 100}
            defaultValue={DEFAULTS.cpmUpliftFactor * 100}
            min={5}
            max={50}
            step={1}
            formatValue={pct}
            onChange={(v) => patch({ cpmUpliftFactor: v / 100 })}
            tooltipContent="Addressable impressions command higher CPMs. Industry benchmarks show 20-30% uplift versus contextual."
          />
          <AssumptionSlider
            label="Contextual CPM ratio"
            description="Contextual CPM as a share of addressable CPM"
            value={state.contextualCpmRatio * 100}
            defaultValue={DEFAULTS.contextualCpmRatio * 100}
            min={50}
            max={95}
            step={1}
            formatValue={pct}
            onChange={(v) => patch({ contextualCpmRatio: v / 100 })}
            tooltipContent="How much of the addressable CPM you capture when selling the same impression contextually. Typically ~72%."
          />
          <AssumptionSlider
            label="CDP monthly savings"
            description="Data-platform cost saved from ID de-duplication"
            value={state.cdpMonthlySavings}
            defaultValue={DEFAULTS.cdpMonthlySavings}
            min={0}
            max={20000}
            step={500}
            formatValue={(v) => `$${(v / 1000).toFixed(1)}K`}
            onChange={(v) => patch({ cdpMonthlySavings: v })}
            tooltipContent="Collapsing ID bloat (from ~3.5 IDs/user to ~1.1) shrinks CDP/martech storage and processing costs."
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AssumptionSlider
            label="Sales readiness"
            description="Team trained to sell addressable inventory"
            value={(r.salesReadiness ?? 0.75) * 100}
            defaultValue={75}
            min={40}
            max={100}
            step={5}
            formatValue={pct}
            onChange={(v) => patchReadiness('salesReadiness', v / 100)}
            tooltipContent="Higher readiness realises more of the CPM uplift and adoption faster."
          />
          <AssumptionSlider
            label="Advertiser buy-in"
            description="Demand-side appetite for addressable buys"
            value={(r.advertiserBuyIn ?? 0.8) * 100}
            defaultValue={80}
            min={40}
            max={100}
            step={5}
            formatValue={pct}
            onChange={(v) => patchReadiness('advertiserBuyIn', v / 100)}
            tooltipContent="Stronger buy-in means more of the recovered inventory is actually monetised at premium rates."
          />
          <AssumptionSlider
            label="Organisational ownership"
            description="Clear internal owner driving rollout"
            value={(r.organizationalOwnership ?? 0.8) * 100}
            defaultValue={80}
            min={40}
            max={100}
            step={5}
            formatValue={pct}
            onChange={(v) => patchReadiness('organizationalOwnership', v / 100)}
            tooltipContent="Dedicated ownership raises adoption of the deployed capability."
          />
          <AssumptionSlider
            label="Market conditions"
            description="Overall ad-market demand environment"
            value={(r.marketConditions ?? 0.85) * 100}
            defaultValue={85}
            min={50}
            max={100}
            step={5}
            formatValue={pct}
            onChange={(v) => patchReadiness('marketConditions', v / 100)}
            tooltipContent="A softer market dampens realised CPM uplift and CDP savings."
          />
          <AssumptionSlider
            label="Training coverage"
            description="Ad-ops fluency with the new workflow"
            value={(r.trainingGaps ?? 0.75) * 100}
            defaultValue={75}
            min={40}
            max={100}
            step={5}
            formatValue={pct}
            onChange={(v) => patchReadiness('trainingGaps', v / 100)}
            tooltipContent="Better training lifts adoption and addressability efficiency."
          />
          <AssumptionSlider
            label="Integration reliability"
            description="Technical integrations landing cleanly"
            value={(r.integrationDelays ?? 0.8) * 100}
            defaultValue={80}
            min={40}
            max={100}
            step={5}
            formatValue={pct}
            onChange={(v) => patchReadiness('integrationDelays', v / 100)}
            tooltipContent="Fewer integration delays means addressability efficiency is realised sooner."
          />
          <AssumptionSlider
            label="Resource availability"
            description="People available to run the programme"
            value={(r.resourceAvailability ?? 0.75) * 100}
            defaultValue={75}
            min={40}
            max={100}
            step={5}
            formatValue={pct}
            onChange={(v) => patchReadiness('resourceAvailability', v / 100)}
            tooltipContent="Thin resourcing slows adoption and can extend the ramp period."
          />
          <AssumptionSlider
            label="Technical deployment"
            description="Months to fully deploy the durable ID"
            value={r.technicalDeploymentMonths ?? 9}
            defaultValue={9}
            min={3}
            max={18}
            step={1}
            formatValue={(v) => `${Math.round(v)} mo`}
            onChange={(v) => patchReadiness('technicalDeploymentMonths', v)}
            tooltipContent="Sets the ramp-up curve on the 12-month projection. Faster deployment reaches full value sooner."
          />
        </div>
      )}
    </div>
  );
};

/* ── Shared payoff props ────────────────────────────────────────────────── */
type PayoffProps = {
  animated: number;
  monthly: number;
  threeYear: number;
  percentImprovement: number;
  recoveredPct: number;
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
  recoveredPct,
  pdfLoading,
  onPdf,
  className = '',
}: PayoffProps) => (
  <aside
    className={`hero-gradient flex min-h-0 flex-col rounded-2xl border border-primary/20 bg-card/40 p-5 backdrop-blur-sm lg:p-6 ${className}`}
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
        <dt className="text-muted-foreground">Dark audience recovered</dt>
        <dd className="font-semibold tabular-nums text-primary">~{formatPercentage(recoveredPct, 0)}</dd>
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
  recoveredPct,
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
      <span className="text-primary">~{formatPercentage(recoveredPct, 0)} recovered</span>
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
