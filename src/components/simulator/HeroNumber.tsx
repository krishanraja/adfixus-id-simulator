import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatCurrency } from '@/utils/formatting';
import { TrendingUp } from 'lucide-react';

interface HeroNumberProps {
  annualUplift: number;
  monthlyUplift: number;
  threeYear: number;
  percentImprovement: number;
}

export const HeroNumber = ({
  annualUplift,
  monthlyUplift,
  threeYear,
  percentImprovement,
}: HeroNumberProps) => {
  const animated = useAnimatedNumber(annualUplift);

  return (
    <div className="hero-gradient relative overflow-hidden rounded-2xl border border-primary/20 bg-card/40 px-6 py-12 text-center backdrop-blur-sm md:py-16">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)' }}
      />

      <div className="relative space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
          Annual recoverable revenue
        </div>

        <div className="text-6xl font-bold leading-none tracking-tight text-primary drop-shadow-[0_0_25px_hsl(var(--primary)/0.35)] md:text-8xl">
          {formatCurrency(animated)}
          <span className="ml-1 align-top text-2xl font-normal text-muted-foreground md:text-3xl">
            /yr
          </span>
        </div>

        <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
          Durable identity recovers Safari addressability you're losing today —
          worth{' '}
          <span className="font-semibold text-foreground">
            {formatCurrency(monthlyUplift)}/month
          </span>{' '}
          and{' '}
          <span className="font-semibold text-foreground">{formatCurrency(threeYear)}</span> over 3
          years.
        </p>

        <div className="flex items-center justify-center gap-2 pt-1 text-sm">
          <span className="rounded-full bg-revenue-gain/15 px-3 py-1 font-semibold text-revenue-gain">
            +{percentImprovement.toFixed(1)}% ad revenue uplift
          </span>
        </div>
      </div>
    </div>
  );
};
