import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
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
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DomainPortfolio } from './DomainPortfolio';
import { BasicInputs } from './BasicInputs';
import { AssumptionSlider } from './AssumptionSlider';
import { AddressabilityWaterfall } from './results/AddressabilityWaterfall';
import { DisplayVideoBreakdown } from './results/DisplayVideoBreakdown';
import { RampChart } from './results/RampChart';
import { TailoredBriefing } from '@/components/flow/TailoredBriefing';
import { DEFAULTS, CDP_DEDUPE_SAVINGS_RATE, type useIdSimulator } from '@/hooks/useIdSimulator';
import {
  OPPORTUNITY_META,
  ROLLOUT_PRESETS,
  ROLLOUT_RAMP_MONTHS,
  NEUTRAL_READINESS,
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
  const {
    state,
    results,
    visibility,
    patch,
    patchReadiness,
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

  // How far the model has drifted from the golden Balanced · Backed baseline.
  // Counts value deviations (so a scenario pick that moves an assumption is
  // reflected) plus each execution-factor nudge.
  const modifiedCount = useMemo(() => {
    let n = 0;
    if (!approxEq(state.baselineAddressability, DEFAULTS.baselineAddressability)) n++;
    if (!approxEq(state.targetSafariAddressability, DEFAULTS.targetSafariAddressability)) n++;
    if (!approxEq(state.cpmUpliftFactor, DEFAULTS.cpmUpliftFactor)) n++;
    if (!approxEq(state.contextualCpmRatio, DEFAULTS.contextualCpmRatio)) n++;
    if (!approxEq(state.cdpMonthlySavings, DEFAULTS.cdpMonthlySavings)) n++;
    if (state.rolloutScenario !== 'backed') n++;
    n += Object.keys(state.readiness).length;
    return n;
  }, [state]);

  // Restore the Balanced · Backed baseline: reset both scenario pickers (which
  // set the opportunity assumptions, risk backbone and clear readiness) and the
  // three known-facts to their defaults.
  const resetAssumptions = () => {
    setOpportunity('balanced');
    setRollout('backed');
    patch({
      baselineAddressability: DEFAULTS.baselineAddressability,
      contextualCpmRatio: DEFAULTS.contextualCpmRatio,
      cdpMonthlySavings: DEFAULTS.cdpMonthlySavings,
    });
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
                    <div className="flex flex-col gap-4">
                      <BasicInputs
                        displayCPM={state.displayCPM}
                        videoCPM={state.videoCPM}
                        onDisplayCPM={(v) => patch({ displayCPM: v })}
                        onVideoCPM={(v) => patch({ videoCPM: v })}
                      />
                      <KnownFacts state={state} patch={patch} />
                    </div>
                  </div>
                )}

                {tab === 'finetune' && (
                  <FineTunePanel
                    state={state}
                    patch={patch}
                    patchReadiness={patchReadiness}
                    setOpportunity={setOpportunity}
                    setRollout={setRollout}
                  />
                )}

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
    </div>
  );
};

/* ── Configure: the three facts a publisher genuinely knows about their own
      business. Everything they can't know is a scenario in Fine-tune. ────── */
type KnownFactsProps = {
  state: Simulator['state'];
  patch: Simulator['patch'];
};

const KnownFacts = ({ state, patch }: KnownFactsProps) => {
  // The publisher tells us their data-platform spend; we model the saving as a
  // share of it, so the number stays in their own terms.
  const cdpSpend = Math.round(state.cdpMonthlySavings / CDP_DEDUPE_SAVINGS_RATE);
  const defaultCdpSpend = Math.round(DEFAULTS.cdpMonthlySavings / CDP_DEDUPE_SAVINGS_RATE);

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">What you already know</h3>
          <p className="text-xs text-muted-foreground">
            Three facts about your business that sharpen the estimate
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <AssumptionSlider
          label="Share matched to a known user today"
          description="Of all your impressions, the slice you can already tie to someone"
          value={state.baselineAddressability * 100}
          defaultValue={DEFAULTS.baselineAddressability * 100}
          min={40}
          max={90}
          step={1}
          formatValue={pct}
          onChange={(v) => patch({ baselineAddressability: v / 100 })}
          tooltipContent="Sets the 'addressable today' baseline in the Breakdown - where you start from. It doesn't change how much a durable ID wins back."
        />
        <AssumptionSlider
          label="What an unmatched impression still earns"
          description="As a share of what a matched one earns"
          value={state.contextualCpmRatio * 100}
          defaultValue={DEFAULTS.contextualCpmRatio * 100}
          min={50}
          max={95}
          step={1}
          formatValue={pct}
          onChange={(v) => patch({ contextualCpmRatio: v / 100 })}
          tooltipContent="When you can't identify a visitor, you sell the impression contextually at a discount. The bigger that gap, the more a durable ID is worth - so a higher number here means a smaller uplift."
        />
        <AssumptionSlider
          label="Monthly spend on your data platform / CDP"
          description={`≈ ${formatCurrency(state.cdpMonthlySavings)}/mo saved by de-duplicating identities`}
          value={cdpSpend}
          defaultValue={defaultCdpSpend}
          min={0}
          max={100000}
          step={1000}
          formatValue={(v) => `$${Math.round(v / 1000)}K`}
          onChange={(v) => patch({ cdpMonthlySavings: Math.round(v * CDP_DEDUPE_SAVINGS_RATE) })}
          tooltipContent="Collapsing duplicate identities (from ~3.5 to ~1.1 per user) shrinks CDP/martech storage and processing. We model the saving at ~15% of that spend."
        />
      </div>
    </Card>
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

/* ── A collapsed "Advanced" reveal for the per-variable diligence cards. ── */
const AdvancedReveal = ({ label, children }: { label: string; children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
};

const OPPORTUNITY_CHOICES: ScenarioChoice<OpportunityKey>[] = (
  Object.keys(OPPORTUNITY_META) as OpportunityKey[]
).map((k) => ({ key: k, label: OPPORTUNITY_META[k].label, blurb: OPPORTUNITY_META[k].blurb }));

const ROLLOUT_CHOICES: ScenarioChoice<RolloutKey>[] = (
  Object.keys(ROLLOUT_PRESETS) as RolloutKey[]
).map((k) => ({ key: k, label: ROLLOUT_PRESETS[k].label, blurb: ROLLOUT_PRESETS[k].blurb }));

/* ── The fine-tune panel: two scenarios a publisher can actually reason about
      (how far to push, and how they'll execute), each with the per-variable
      diligence cards one click away under "Advanced". ──────────────────── */
type FineTunePanelProps = {
  state: Simulator['state'];
  patch: Simulator['patch'];
  patchReadiness: Simulator['patchReadiness'];
  setOpportunity: Simulator['setOpportunity'];
  setRollout: Simulator['setRollout'];
};

const FineTunePanel = ({
  state,
  patch,
  patchReadiness,
  setOpportunity,
  setRollout,
}: FineTunePanelProps) => {
  const r = state.readiness;
  const N = NEUTRAL_READINESS;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Pick the scenario that matches your business - the result updates live. Open{' '}
        <span className="font-medium text-foreground">Advanced</span> under either one to
        challenge the detail.
      </p>

      {/* ── The opportunity: how far to push ─────────────────────────────── */}
      <section className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
        <SectionHead
          icon={Target}
          title="The opportunity - how far you'd push"
          subtitle="Two things only AdFixus can benchmark: how much Safari audience a durable ID wins back, and the premium it earns. Choose how ambitious to be."
        />
        <ScenarioPicker
          options={OPPORTUNITY_CHOICES}
          active={state.opportunityScenario}
          onPick={setOpportunity}
        />
        <AdvancedReveal label="Advanced - the two upside assumptions">
          <div className="grid gap-3 sm:grid-cols-2">
            <AssumptionSlider
              label="How much Safari audience we win back"
              description="Share of Safari visitors a durable ID re-identifies"
              value={state.targetSafariAddressability * 100}
              defaultValue={DEFAULTS.targetSafariAddressability * 100}
              min={10}
              max={60}
              step={1}
              formatValue={pct}
              onChange={(v) => patch({ targetSafariAddressability: v / 100 })}
              tooltipContent="Safari and ITP cap cookies at 7 days, so returning Safari visitors look new. A durable, owned ID recognises them again. The scenario sets this - drag to override."
            />
            <AssumptionSlider
              label="Premium on impressions we make addressable again"
              description="Extra CPM a known impression earns over an unknown one"
              value={state.cpmUpliftFactor * 100}
              defaultValue={DEFAULTS.cpmUpliftFactor * 100}
              min={5}
              max={50}
              step={1}
              formatValue={pct}
              onChange={(v) => patch({ cpmUpliftFactor: v / 100 })}
              tooltipContent="Advertisers pay more for impressions tied to a known user - industry benchmarks show 20-30% uplift. The scenario sets this - drag to override."
            />
          </div>
        </AdvancedReveal>
      </section>

      {/* ── Your rollout: how you'll execute ─────────────────────────────── */}
      <section className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
        <SectionHead
          icon={Rocket}
          title="Your rollout - how you'll actually execute"
          subtitle="How much of that opportunity you realise depends on your team and timeline. Pick the situation closest to yours; the cards below start from a neutral baseline you can nudge."
        />
        <ScenarioPicker
          options={ROLLOUT_CHOICES}
          active={state.rolloutScenario}
          onPick={setRollout}
        />
        <AdvancedReveal label="Advanced - nudge the execution factors">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AssumptionSlider
              label="Sales readiness"
              description="Team trained to sell addressable inventory"
              value={(r.salesReadiness ?? N.salesReadiness) * 100}
              defaultValue={N.salesReadiness * 100}
              min={40}
              max={100}
              step={5}
              formatValue={pct}
              onChange={(v) => patchReadiness('salesReadiness', v / 100)}
              tooltipContent="Higher readiness realises more of the CPM premium, and adoption comes faster."
            />
            <AssumptionSlider
              label="Advertiser buy-in"
              description="Demand-side appetite for addressable buys"
              value={(r.advertiserBuyIn ?? N.advertiserBuyIn) * 100}
              defaultValue={N.advertiserBuyIn * 100}
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
              value={(r.organizationalOwnership ?? N.organizationalOwnership) * 100}
              defaultValue={N.organizationalOwnership * 100}
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
              value={(r.marketConditions ?? N.marketConditions) * 100}
              defaultValue={N.marketConditions * 100}
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
              value={(r.trainingGaps ?? N.trainingGaps) * 100}
              defaultValue={N.trainingGaps * 100}
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
              value={(r.integrationDelays ?? N.integrationDelays) * 100}
              defaultValue={N.integrationDelays * 100}
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
              value={(r.resourceAvailability ?? N.resourceAvailability) * 100}
              defaultValue={N.resourceAvailability * 100}
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
              value={r.technicalDeploymentMonths ?? ROLLOUT_RAMP_MONTHS[state.rolloutScenario]}
              defaultValue={ROLLOUT_RAMP_MONTHS[state.rolloutScenario]}
              min={3}
              max={18}
              step={1}
              formatValue={(v) => `${Math.round(v)} mo`}
              onChange={(v) => patchReadiness('technicalDeploymentMonths', v)}
              tooltipContent="Sets how quickly the 12-month projection ramps to full value. Faster deployment reaches it sooner; it doesn't change the annual total."
            />
          </div>
        </AdvancedReveal>
      </section>
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
