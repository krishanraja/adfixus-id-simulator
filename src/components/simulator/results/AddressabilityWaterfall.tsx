import { Card } from '@/components/ui/card';
import { formatPercentage } from '@/utils/formatting';
import type { UnifiedResults } from '@/core';

interface AddressabilityWaterfallProps {
  results: UnifiedResults;
}

/**
 * CSS/div waterfall: baseline addressable inventory, the Safari-driven recovery
 * added on top, and the improved total. Also shows the Safari-specific
 * before/after which is the headline durability story.
 */
export const AddressabilityWaterfall = ({ results }: AddressabilityWaterfallProps) => {
  const d = results.idInfrastructure.details;
  const baseline = d.currentAddressability; // %
  const gain = d.totalAddressabilityImprovement; // %
  const improved = d.improvedAddressability; // %
  const max = Math.max(improved, 100 - improved > 0 ? improved : 100);
  const scale = (v: number) => `${Math.min(100, (v / Math.max(max, 1)) * 100)}%`;

  return (
    <Card className="p-6">
      <div className="mb-1 text-base font-semibold">Bringing the audience back into view</div>
      <p className="mb-6 text-sm text-muted-foreground">
        The share of your audience you can recognise, before and after a durable
        identity re-identifies returning humans.
      </p>

      {/* Waterfall bars */}
      <div className="space-y-4">
        <WaterfallRow
          label="Addressable today"
          value={baseline}
          width={scale(baseline)}
          colorClass="bg-muted-foreground/40"
        />
        <WaterfallRow
          label="Safari recovery"
          value={gain}
          width={scale(gain)}
          offset={scale(baseline)}
          colorClass="bg-primary"
          prefix="+"
        />
        <WaterfallRow
          label="Addressable with AdFixus"
          value={improved}
          width={scale(improved)}
          colorClass="bg-gradient-to-r from-primary to-primary-glow"
          emphasize
        />
      </div>

      {/* Safari before/after */}
      <div className="mt-6 grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Safari addressability today
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-muted-foreground">
            {formatPercentage(d.currentSafariAddressability, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Safari with durable ID
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {formatPercentage(d.targetSafariAddressability, 0)}
          </p>
        </div>
      </div>
    </Card>
  );
};

const WaterfallRow = ({
  label,
  value,
  width,
  offset,
  colorClass,
  prefix = '',
  emphasize = false,
}: {
  label: string;
  value: number;
  width: string;
  offset?: string;
  colorClass: string;
  prefix?: string;
  emphasize?: boolean;
}) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between text-sm">
      <span className={emphasize ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className="font-semibold tabular-nums">
        {prefix}
        {formatPercentage(value, 1)}
      </span>
    </div>
    <div className="relative h-6 w-full overflow-hidden rounded-lg bg-secondary/60">
      {offset && <div className="absolute inset-y-0 left-0" style={{ width: offset }} />}
      <div
        className={`absolute inset-y-0 rounded-lg ${colorClass} transition-all duration-500`}
        style={{ left: offset ?? 0, width }}
      />
    </div>
  </div>
);
