import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { UnifiedCalculationEngine, type UnifiedResults } from '@/core';
import { formatCurrency } from '@/utils/formatting';

interface RampChartProps {
  results: UnifiedResults;
}

export const RampChart = ({ results }: RampChartProps) => {
  const data = useMemo(() => {
    const projection = UnifiedCalculationEngine.generateMonthlyProjection(results);
    return projection.map((p) => ({
      month: p.monthLabel.replace('Month ', 'M'),
      uplift: Math.round(p.uplift),
      cumulative: 0, // filled below
      rampPct: Math.round(p.rampUpFactor * 100),
    })).reduce<{ month: string; uplift: number; cumulative: number; rampPct: number }[]>(
      (acc, cur) => {
        const prev = acc.length ? acc[acc.length - 1].cumulative : 0;
        acc.push({ ...cur, cumulative: prev + cur.uplift });
        return acc;
      },
      [],
    );
  }, [results]);

  return (
    <Card className="p-6">
      <div className="mb-1 text-base font-semibold">The first 12 months</div>
      <p className="mb-4 text-sm text-muted-foreground">
        Recovered revenue builds month over month as more returning humans are
        re-recognised.
      </p>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="rampFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(195 95% 50%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(195 95% 50%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'hsl(0 0% 65%)' }}
              stroke="hsl(0 0% 25%)"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(0 0% 65%)' }}
              stroke="hsl(0 0% 25%)"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              width={48}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as {
                    month: string;
                    uplift: number;
                    cumulative: number;
                    rampPct: number;
                  };
                  return (
                    <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-xl">
                      <p className="mb-1 font-semibold">{p.month}</p>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between gap-6">
                          <span className="text-muted-foreground">Monthly uplift</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(p.uplift)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-muted-foreground">Cumulative</span>
                          <span className="font-semibold">{formatCurrency(p.cumulative)}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-muted-foreground">Ramp</span>
                          <span className="font-semibold">{p.rampPct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="uplift"
              stroke="hsl(195 95% 50%)"
              strokeWidth={2}
              fill="url(#rampFill)"
              name="Monthly uplift"
            />
            <Line
              type="monotone"
              dataKey="uplift"
              stroke="hsl(195 95% 60%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(195 95% 60%)', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
