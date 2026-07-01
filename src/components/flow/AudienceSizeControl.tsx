import { Slider } from '@/components/ui/slider';
import { formatNumber } from '@/utils/formatting';

interface AudienceSizeControlProps {
  /** Monthly pageviews for the primary property. */
  value: number;
  onChange: (monthlyPageviews: number) => void;
}

/** A few tactile preset sizes, expressed in monthly pageviews. */
const PRESETS: { label: string; sub: string; value: number }[] = [
  { label: 'Growing', sub: '~5M/mo', value: 5_000_000 },
  { label: 'Established', sub: '~50M/mo', value: 50_000_000 },
  { label: 'Large', sub: '~250M/mo', value: 250_000_000 },
  { label: 'At scale', sub: '~1B/mo', value: 1_000_000_000 },
];

// Log-scaled slider so 1M–2B feels linear to drag.
const MIN = 1_000_000;
const MAX = 2_000_000_000;
const toSlider = (v: number) =>
  ((Math.log10(Math.max(MIN, Math.min(MAX, v))) - Math.log10(MIN)) /
    (Math.log10(MAX) - Math.log10(MIN))) *
  100;
const fromSlider = (s: number) =>
  Math.round(10 ** (Math.log10(MIN) + (s / 100) * (Math.log10(MAX) - Math.log10(MIN))));

const nearestPreset = (v: number) =>
  PRESETS.reduce((best, p) =>
    Math.abs(Math.log10(p.value) - Math.log10(v)) < Math.abs(Math.log10(best.value) - Math.log10(v))
      ? p
      : best,
  );

export const AudienceSizeControl = ({ value, onChange }: AudienceSizeControlProps) => {
  const active = nearestPreset(value);

  return (
    <div className="mx-auto max-w-xl">
      {/* Live readout */}
      <div className="mb-8 text-center">
        <div className="text-5xl font-bold tabular-nums text-primary drop-shadow-[0_0_25px_hsl(var(--primary)/0.35)] md:text-6xl">
          {formatNumber(value)}
        </div>
        <div className="mt-1 text-sm uppercase tracking-widest text-muted-foreground">
          monthly pageviews
        </div>
      </div>

      {/* Preset sizes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRESETS.map((p) => {
          const selected = p.value === active.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={[
                'rounded-2xl border px-3 py-4 text-center transition-all',
                selected
                  ? 'border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.25)]'
                  : 'border-border bg-secondary/30 hover:border-primary/40',
              ].join(' ')}
              aria-pressed={selected}
            >
              <div
                className={[
                  'text-sm font-semibold',
                  selected ? 'text-primary' : 'text-foreground',
                ].join(' ')}
              >
                {p.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{p.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Fine control */}
      <div className="mt-8">
        <Slider
          value={[toSlider(value)]}
          min={0}
          max={100}
          step={0.5}
          onValueChange={([s]) => onChange(fromSlider(s))}
          aria-label="Monthly pageviews"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>1M</span>
          <span>2B</span>
        </div>
      </div>
    </div>
  );
};
