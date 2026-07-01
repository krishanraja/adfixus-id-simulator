import { Card } from '@/components/ui/card';
import { DollarSign, Radar, Layers, Database } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';
import type { UnifiedResults } from '@/core';

interface MetricCardsProps {
  results: UnifiedResults;
}

export const MetricCards = ({ results }: MetricCardsProps) => {
  const id = results.idInfrastructure;
  const totals = results.totals;

  const cards = [
    {
      icon: DollarSign,
      label: 'Recovered ad revenue',
      value: formatCurrency(totals.totalAnnualUplift),
      sub: `${formatCurrency(totals.totalMonthlyUplift)}/mo`,
      accent: true,
    },
    {
      icon: Radar,
      label: 'Safari audience recognised again',
      value: formatPercentage(id.details.targetSafariAddressability, 0),
      sub: `of the ${formatPercentage(id.details.safariShare, 0)} on Safari going dark`,
    },
    {
      icon: Layers,
      label: 'Impressions brought back into view',
      value: `${formatNumber(id.details.newlyAddressableImpressions)}/mo`,
      sub: 'now sellable at their true value',
    },
    {
      icon: Database,
      label: 'One identity, not many',
      value: `${formatCurrency(id.details.monthlyCdpSavings)}/mo`,
      sub: `${formatPercentage(id.details.idReductionPercentage, 0)} fewer duplicate profiles`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={`scanner-card p-5 ${
            c.accent ? 'border-primary/30 bg-primary/5' : 'bg-card'
          }`}
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <c.icon className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {c.label}
          </p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${
              c.accent ? 'text-primary' : 'text-foreground'
            }`}
          >
            {c.value}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
};
