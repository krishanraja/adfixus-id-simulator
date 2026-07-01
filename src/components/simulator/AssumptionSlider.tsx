import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Info, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AssumptionSliderProps {
  label: string;
  description?: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
  tooltipContent?: string;
}

/**
 * Reusable labelled slider with tooltip, live formatted value, a "modified"
 * accent, and a reset affordance. Ported from the Vox reference and adapted to
 * the dark AdFixus theme.
 */
export const AssumptionSlider = ({
  label,
  description,
  value,
  defaultValue,
  min,
  max,
  step,
  formatValue,
  onChange,
  tooltipContent,
}: AssumptionSliderProps) => {
  const isModified = Math.abs(value - defaultValue) > 0.0001;

  return (
    <div className="space-y-2 p-4 rounded-xl border border-border bg-secondary/30 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{label}</span>
          {tooltipContent && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-sm font-semibold tabular-nums ${
              isModified ? 'text-primary' : 'text-foreground'
            }`}
          >
            {formatValue(value)}
          </span>
          {isModified && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(defaultValue)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              aria-label={`Reset ${label}`}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="mt-1"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};
