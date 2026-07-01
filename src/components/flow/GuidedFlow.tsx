import { useState } from 'react';
import { useIdSimulator } from '@/hooks/useIdSimulator';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import { MEETING_BOOKING_URL } from '@/config';
import { resolveDomainProfile, type DomainProfile } from '@/core/intel';
import { IdSimulator } from '@/components/simulator/IdSimulator';
import { FlowShell } from './FlowShell';
import { Provocation } from './Provocation';
import { DomainStep } from './DomainStep';
import { AskStep } from './AskStep';
import { Reveal } from './Reveal';
import { TailoredBriefing } from './TailoredBriefing';
import { DepthDrawer } from './DepthDrawer';
import { AudienceSizeControl } from './AudienceSizeControl';

const STEP_COUNT = 4;

/**
 * The Apple-grade guided surface for the ID Durability Simulator.
 *
 * Four screens, almost no input:
 *   0. Provocation - the anonymous majority is going dark.
 *   1. DomainStep - the visitor types their site; the tool recognises the
 *      business and pre-fills the model (the "magic populate" moment).
 *   2. AskStep - confirm/adjust the audience size (pre-seeded from the vertical).
 *   3. Reveal - the annual value a durable owned identity brings back, plus a
 *      briefing tailored to their business and its identity challenge.
 *
 * The full configurable simulator (with the same tailored briefing up top) lives
 * one click away in the DepthDrawer. The flow and the drawer share ONE simulator
 * instance, so everything chosen here carries straight into the full picture.
 */
export const GuidedFlow = () => {
  const simulator = useIdSimulator();
  const { state, results, visibility, updateDomain, patch } = simulator;

  const [step, setStep] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<DomainProfile>(() => resolveDomainProfile(''));

  const primary = state.domains[0];
  const setAudience = (monthlyPageviews: number) =>
    updateDomain(primary.id, { monthlyPageviews });

  // Recognise the domain and pre-fill the model from the vertical's benchmarks.
  const applyProfile = (resolved: DomainProfile) => {
    setProfile(resolved);
    if (resolved.domain) {
      const s = resolved.archetype.seeds;
      updateDomain(primary.id, {
        name: resolved.company,
        safariShare: s.safariShare,
        displayVideoSplit: s.displayVideoSplit,
        adsPerPage: s.adsPerPage,
        monthlyPageviews: s.monthlyPageviews,
      });
      patch({ displayCPM: s.displayCPM, videoCPM: s.videoCPM });
    }
    setStep(2);
  };

  const annual = results.totals.totalAnnualUplift;
  const recoveredPct = Math.round(visibility.recoveredShare * 100);
  const recognised = profile.domain !== null;

  const openDepth = () => setDrawerOpen(true);

  return (
    <>
      {/* The guided flow is hidden (not unmounted) while the full picture is
          open, so the drawer stands in normal document flow and the iframe-embed
          height reporting tracks the drawer's true height. */}
      <div className={drawerOpen ? 'hidden' : undefined}>
        <FlowShell step={step} stepCount={STEP_COUNT} onStepSelect={setStep}>
          {step === 0 && (
            <Provocation
              eyebrow="Identity-durability audit"
              headline={
                <>
                  On the AI-saturated web, most of your audience has already gone{' '}
                  <span className="gradient-text">dark</span>.
                </>
              }
              support="Cookies decay, Safari and ITP blind the anonymous majority, and AI crawlers eat the rest. The question isn't how to target - it's whether you still recognise the humans on your own site."
              cta="Show me what's at stake"
              onContinue={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <DomainStep
              initialValue={profile.raw}
              onContinue={applyProfile}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && (
            <AskStep
              eyebrow={recognised ? `Tuning for ${profile.company}` : 'One question'}
              question={
                <>
                  Roughly how big is your{' '}
                  <span className="text-primary">audience</span>?
                </>
              }
              hint={
                recognised
                  ? "We've started from a typical figure for your vertical - nudge it to your real monthly pageviews. Everything else is inferred from open-web benchmarks."
                  : 'A rough sense is all we need - everything else is inferred from open-web benchmarks. You can fine-tune anything later.'
              }
              onContinue={() => setStep(3)}
              onBack={() => setStep(1)}
            >
              <AudienceSizeControl
                value={primary.monthlyPageviews}
                onChange={setAudience}
              />
            </AskStep>
          )}

          {step === 3 && (
            <Reveal
              eyebrow={
                recognised
                  ? `What a durable, owned identity brings back for ${profile.company}`
                  : 'What a durable, owned identity brings back into view'
              }
              value={annual}
              format={formatCurrency}
              suffix="/yr"
              meaning={
                <>
                  Re-recognising the audience {recognised ? profile.company : 'you'}
                  {recognised ? ' is' : "'re"} losing today puts about{' '}
                  <span className="font-semibold text-foreground">
                    {formatPercentage(recoveredPct, 0)}
                  </span>{' '}
                  of them back within reach - recovered ad revenue that compounds as
                  durable identity takes hold.
                </>
              }
              panel={recognised ? <TailoredBriefing profile={profile} compact /> : undefined}
              ctaLabel="Book a conversation"
              ctaHref={MEETING_BOOKING_URL}
              secondaryLabel={
                recognised ? 'See the full picture & briefing / Customise' : 'See the full picture / Customise'
              }
              onSecondary={openDepth}
            />
          )}
        </FlowShell>
      </div>

      <DepthDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="The full picture · Customise"
      >
        <IdSimulator simulator={simulator} profile={profile} embedded />
      </DepthDrawer>
    </>
  );
};
