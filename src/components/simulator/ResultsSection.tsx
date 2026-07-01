import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, CalendarCheck, Loader2, ArrowRight } from 'lucide-react';
import { MetricCards } from './results/MetricCards';
import { AddressabilityWaterfall } from './results/AddressabilityWaterfall';
import { RampChart } from './results/RampChart';
import { DisplayVideoBreakdown } from './results/DisplayVideoBreakdown';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import { downloadIdProposalPdf } from '@/utils/idPdf';
import { MEETING_BOOKING_URL } from '@/config';
import type { UnifiedResults } from '@/core';
import type { AudienceVisibility, IdSimulatorState } from '@/hooks/useIdSimulator';

interface ResultsSectionProps {
  results: UnifiedResults;
  state: IdSimulatorState;
  visibility: AudienceVisibility;
}

export const ResultsSection = ({ results, state, visibility }: ResultsSectionProps) => {
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

  const drivers = [
    {
      name: 'Recognising more of your audience',
      note: 'Returning humans re-identified past the cookie window - sold at their true, addressable value.',
      value: results.idInfrastructure.details.addressabilityRevenue,
      color: 'hsl(195 95% 55%)',
    },
    {
      name: 'One clean identity, not many',
      note: 'Collapsing duplicate profiles trims data-platform cost and sharpens who a real person is.',
      value: results.idInfrastructure.details.monthlyCdpSavings,
      color: 'hsl(195 60% 40%)',
    },
  ];
  const driverTotal = drivers.reduce((s, d) => s + d.value, 0) || 1;

  const invisiblePct = Math.round(visibility.invisibleShare * 100);
  const recoveredPct = Math.round(visibility.recoveredShare * 100);
  const stillDarkPct = Math.round(visibility.stillInvisibleShare * 100);

  return (
    <div className="space-y-8">
      {/* Narrative lead-in: the audience story before the numbers */}
      <Card className="border-primary/20 bg-primary/[0.04] p-6">
        <p className="text-base leading-relaxed text-foreground md:text-lg">
          Today, about{' '}
          <span className="font-semibold text-primary">{formatPercentage(invisiblePct, 0)}</span> of
          your audience is invisible. A durable, owned identity brings roughly{' '}
          <span className="font-semibold text-primary">{formatPercentage(recoveredPct, 0)}</span> of
          them back into view - leaving only{' '}
          <span className="font-semibold text-foreground">{formatPercentage(stillDarkPct, 0)}</span>{' '}
          genuinely unreachable. That recovered recognition is where the numbers
          below come from.
        </p>
      </Card>

      <MetricCards results={results} />

      <div>
        <h3 className="mb-4 text-lg font-semibold">From invisible to addressable</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <AddressabilityWaterfall results={results} />
          <DisplayVideoBreakdown results={results} state={state} />
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-lg font-semibold">It compounds, it doesn&rsquo;t switch on</h3>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          Durable identity is owned infrastructure - recognition and value build
          month over month as more returning humans are re-identified.
        </p>
        <RampChart results={results} />
      </div>

      {/* Where the value comes from - benefits, not line items */}
      <Card className="p-6">
        <div className="mb-1 text-lg font-semibold">Where the value comes from</div>
        <p className="mb-5 text-sm text-muted-foreground">
          Two effects of owning identity rather than renting it.
        </p>
        <div className="space-y-5">
          {drivers.map((d) => {
            const pct = (d.value / driverTotal) * 100;
            return (
              <div key={d.name}>
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{d.name}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{d.note}</p>
                  </div>
                  <div className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {formatCurrency(d.value)}/mo
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {formatPercentage(pct, 0)}
                  </div>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Calm next step - hint at the free Forensic Audit, low pressure */}
      <Card className="hero-gradient flex flex-col items-center gap-5 border-primary/20 p-8 text-center md:p-10">
        <div className="max-w-xl">
          <h3 className="text-xl font-semibold md:text-2xl">
            This is a model. The next step is your real data.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            If the picture rings true, we run a free Forensic Audit against your
            actual site and stack - your real Safari share, your anonymous
            majority, your exposure to AI crawlers - and hand you the numbers,
            no obligation. A short conversation is the fastest way to start.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <a href={MEETING_BOOKING_URL} target="_blank" rel="noreferrer">
              <CalendarCheck className="h-4 w-4" />
              Book a conversation
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button onClick={handlePdf} variant="outline" size="lg" className="gap-2" disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Take the summary with you
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          No sales pressure - the audit is yours to keep either way.
        </p>
      </Card>
    </div>
  );
};
