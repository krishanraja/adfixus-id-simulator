import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, CalendarCheck, Loader2 } from 'lucide-react';
import { MetricCards } from './results/MetricCards';
import { AddressabilityWaterfall } from './results/AddressabilityWaterfall';
import { RampChart } from './results/RampChart';
import { DisplayVideoBreakdown } from './results/DisplayVideoBreakdown';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import { downloadIdProposalPdf } from '@/utils/idPdf';
import { MEETING_BOOKING_URL } from '@/config';
import type { UnifiedResults } from '@/core';
import type { IdSimulatorState } from '@/hooks/useIdSimulator';

interface ResultsSectionProps {
  results: UnifiedResults;
  state: IdSimulatorState;
}

export const ResultsSection = ({ results, state }: ResultsSectionProps) => {
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
      name: 'Addressability & CPM recovery',
      value: results.idInfrastructure.details.addressabilityRevenue,
      color: 'hsl(195 95% 55%)',
    },
    {
      name: 'CDP / data-platform savings',
      value: results.idInfrastructure.details.monthlyCdpSavings,
      color: 'hsl(195 60% 40%)',
    },
  ];
  const driverTotal = drivers.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="space-y-6">
      <MetricCards results={results} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AddressabilityWaterfall results={results} />
        <DisplayVideoBreakdown results={results} state={state} />
      </div>

      <RampChart results={results} />

      {/* Revenue drivers */}
      <Card className="p-6">
        <div className="mb-4 text-base font-semibold">Monthly value drivers</div>
        <div className="space-y-4">
          {drivers.map((d) => {
            const pct = (d.value / driverTotal) * 100;
            return (
              <div key={d.name} className="flex items-center gap-4">
                <div className="w-48 shrink-0 text-sm text-muted-foreground">{d.name}</div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: d.color }}
                  />
                </div>
                <div className="w-24 text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(d.value)}/mo
                </div>
                <div className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                  {formatPercentage(pct, 0)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* CTA */}
      <Card className="hero-gradient flex flex-col items-center gap-4 border-primary/20 p-8 text-center">
        <div>
          <h3 className="text-xl font-semibold">Ready to see it on your real inventory?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Download the summary or book 30 minutes with the AdFixus team.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={handlePdf} size="lg" className="gap-2" disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF report
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <a href={MEETING_BOOKING_URL} target="_blank" rel="noreferrer">
              <CalendarCheck className="h-4 w-4" />
              Book a meeting
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
};
