import { useState } from 'react';
import { useIdSimulator } from '@/hooks/useIdSimulator';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import { MEETING_BOOKING_URL } from '@/config';
import { IdSimulator } from '@/components/simulator/IdSimulator';
import { FlowShell } from './FlowShell';
import { Provocation } from './Provocation';
import { AskStep } from './AskStep';
import { Reveal } from './Reveal';
import { DepthDrawer } from './DepthDrawer';
import { AudienceSizeControl } from './AudienceSizeControl';

const STEP_COUNT = 3;

/**
 * The Apple-grade guided surface for the ID Durability Simulator.
 *
 * Default path is three screens with almost no input:
 *   1. Provocation - the anonymous majority is going dark.
 *   2. AskStep - roughly how big is your audience (one tactile control).
 *   3. Reveal - the annual value a durable owned identity brings back into view.
 *
 * All the existing richness (full sliders, portfolio, advanced panel, waterfall,
 * ramp chart, breakdowns) is unchanged and lives one click away in the
 * DepthDrawer. The flow and the drawer share ONE simulator instance, so the
 * audience size chosen here carries straight into the full picture.
 */
export const GuidedFlow = () => {
  const simulator = useIdSimulator();
  const { state, results, visibility, updateDomain } = simulator;

  const [step, setStep] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primary = state.domains[0];
  const setAudience = (monthlyPageviews: number) =>
    updateDomain(primary.id, { monthlyPageviews });

  const annual = results.totals.totalAnnualUplift;
  const recoveredPct = Math.round(visibility.recoveredShare * 100);

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
          <AskStep
            eyebrow="One question"
            question={
              <>
                Roughly how big is your{' '}
                <span className="text-primary">audience</span>?
              </>
            }
            hint="A rough sense is all we need - everything else is inferred from open-web benchmarks. You can fine-tune anything later."
            onContinue={() => setStep(2)}
            onBack={() => setStep(0)}
          >
            <AudienceSizeControl
              value={primary.monthlyPageviews}
              onChange={setAudience}
            />
          </AskStep>
        )}

        {step === 2 && (
          <Reveal
            eyebrow="What a durable, owned identity brings back into view"
            value={annual}
            format={formatCurrency}
            suffix="/yr"
            meaning={
              <>
                Re-recognising the audience you&rsquo;re losing today puts about{' '}
                <span className="font-semibold text-foreground">
                  {formatPercentage(recoveredPct, 0)}
                </span>{' '}
                of them back within reach - recovered ad revenue that compounds as
                durable identity takes hold.
              </>
            }
            ctaLabel="Book a conversation"
            ctaHref={MEETING_BOOKING_URL}
            secondaryLabel="See the full picture / Customise"
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
        <IdSimulator simulator={simulator} embedded />
      </DepthDrawer>
    </>
  );
};
