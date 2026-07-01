import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { formatCurrency, formatPercentage } from '@/utils/formatting';
import type { UnifiedResults } from '@/core';
import type { IdSimulatorState } from '@/hooks/useIdSimulator';

interface DisplayVideoBreakdownProps {
  results: UnifiedResults;
  state: IdSimulatorState;
}

/**
 * Splits the ID-infrastructure addressability uplift between display and video.
 * The core engine computes these internally (newlyAddressableDisplay/Video ×
 * per-format CPM delta) but only surfaces the combined figure, so we reconstruct
 * the split from the same inputs to visualise the format mix.
 */
export const DisplayVideoBreakdown = ({ results, state }: DisplayVideoBreakdownProps) => {
  const d = results.idInfrastructure.details;

  // Pageview-weighted display share (matches the engine aggregation).
  const totalPv = state.domains.reduce((s, dm) => s + dm.monthlyPageviews, 0) || 1;
  const displayShare =
    state.domains.reduce((s, dm) => s + (dm.displayVideoSplit / 100) * dm.monthlyPageviews, 0) /
    totalPv;
  const videoShare = 1 - displayShare;

  const safariShare = d.safariShare / 100;
  const improvement = d.safariAddressabilityImprovement / 100;
  const uplift = state.cpmUpliftFactor;
  const contextual = state.contextualCpmRatio;

  const totalImpressions = state.domains.reduce(
    (s, dm) => s + dm.monthlyPageviews * dm.adsPerPage,
    0,
  );
  const displayImpr = totalImpressions * displayShare;
  const videoImpr = totalImpressions * videoShare;

  const cpmDelta = (cpm: number) => cpm * (1 + uplift) - cpm * contextual;
  const rawDisplay = (displayImpr * safariShare * improvement / 1000) * cpmDelta(state.displayCPM);
  const rawVideo = (videoImpr * safariShare * improvement / 1000) * cpmDelta(state.videoCPM);

  // Scale to the risk-adjusted addressability revenue actually reported.
  const rawTotal = rawDisplay + rawVideo || 1;
  const reported = d.addressabilityRevenue;
  const displayUplift = (rawDisplay / rawTotal) * reported;
  const videoUplift = (rawVideo / rawTotal) * reported;

  const chartData = [
    { name: 'Display', value: Math.max(0, Math.round(displayUplift)), color: 'hsl(195 95% 55%)' },
    { name: 'Video', value: Math.max(0, Math.round(videoUplift)), color: 'hsl(195 60% 35%)' },
  ];
  const total = chartData[0].value + chartData[1].value || 1;

  return (
    <Card className="p-6">
      <div className="mb-1 text-base font-semibold">Display vs video uplift</div>
      <p className="mb-4 text-sm text-muted-foreground">
        Where the recovered addressable revenue comes from.
      </p>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="h-[180px] w-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload as { name: string; value: number };
                    return (
                      <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow-xl">
                        <span className="font-semibold">{p.name}: </span>
                        {formatCurrency(p.value)}/mo
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full space-y-3">
          {chartData.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(c.value)}/mo
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(c.value / total) * 100}%`, background: c.color }}
                />
              </div>
              <p className="text-right text-xs text-muted-foreground">
                {formatPercentage((c.value / total) * 100, 0)} of uplift
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
