import { ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';
import type { UnifiedResults } from '@/core';
import type { AudienceVisibility } from '@/hooks/useIdSimulator';

interface AddressabilityWaterfallProps {
  results: UnifiedResults;
  visibility: AudienceVisibility;
  /** Short name of the chosen rollout (e.g. "Backed") for the realised-value line. */
  rolloutName: string;
}

/**
 * The total-addressability story: how much of the audience you can recognise
 * today (the non-Apple slice) vs with AdFixus (the dark Apple slice brought back).
 * A traceability strip then walks the recovered slice all the way to the dollars,
 * making the capability (addressability) and the realised revenue one legible chain
 * - never asserting a bald "Safari is 0% addressable today" absolute.
 */
export const AddressabilityWaterfall = ({
  results,
  visibility,
  rolloutName,
}: AddressabilityWaterfallProps) => {
  const d = results.idInfrastructure.details;
  const baseline = d.currentAddressability; // % you still recognise today (= 1 - Apple share)
  const gain = d.totalAddressabilityImprovement; // % recovered
  const improved = d.improvedAddressability; // % with AdFixus (<= 100 by construction)
  // Values are already 0-100; scale bar widths against the full 100% axis so the
  // ~95% bar reads as near-full with a visible residual dark sliver to 100%.
  const scale = (v: number) => `${Math.min(100, Math.max(0, v))}%`;

  return (
    <Card className="p-6">
      <div className="mb-1 text-base font-semibold">
        From {formatPercentage(baseline, 0)} to {formatPercentage(improved, 0)} addressable
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        How much of your audience a durable, owned identity lets you recognise. The
        recovered slice is your dark Apple&nbsp;/&nbsp;Safari audience &ndash; invisible
        once cookies expire, brought back into view.
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
          label="Apple audience recovered"
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

      {/* Traceability strip: recovered slice -> impressions -> $ -> realised $. */}
      <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          The recovered slice, end to end
        </p>
        <ol className="space-y-2 text-sm">
          <TraceStep>
            <span className="font-semibold tabular-nums text-foreground">
              {formatPercentage(gain, 0)}
            </span>{' '}
            of your audience recovered
          </TraceStep>
          <TraceStep arrow>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(visibility.newlyAddressableImpressions)}
            </span>{' '}
            impressions / mo now addressable
          </TraceStep>
          <TraceStep arrow>
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrency(visibility.grossRecovery)}
            </span>
            /mo full recovery value
          </TraceStep>
          <TraceStep arrow emphasize>
            realised at your {rolloutName} rollout:{' '}
            <span className="font-bold tabular-nums text-primary">
              {formatCurrency(visibility.realizedRecovery)}
            </span>
            /mo
          </TraceStep>
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Addressability is the capability a durable ID unlocks. The dollars are what
          your rollout captures in year one &ndash; the rest compounds as adoption builds.
        </p>
      </div>
    </Card>
  );
};

const TraceStep = ({
  children,
  arrow = false,
  emphasize = false,
}: {
  children: React.ReactNode;
  arrow?: boolean;
  emphasize?: boolean;
}) => (
  <li className={`flex items-start gap-2 ${emphasize ? 'text-foreground' : 'text-muted-foreground'}`}>
    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
      {arrow ? (
        <ArrowDown className="h-3.5 w-3.5 text-primary/70" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </span>
    <span className="leading-snug">{children}</span>
  </li>
);

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
      <div
        className={`absolute inset-y-0 rounded-lg ${colorClass} transition-all duration-500`}
        style={{ left: offset ?? 0, width }}
      />
    </div>
  </div>
);
