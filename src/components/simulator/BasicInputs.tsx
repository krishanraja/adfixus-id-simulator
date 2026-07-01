import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SlidersHorizontal } from 'lucide-react';
import type { RiskScenario } from '@/core';
import { RISK_SCENARIO_DESCRIPTIONS } from '@/core';

interface BasicInputsProps {
  displayCPM: number;
  videoCPM: number;
  risk: RiskScenario;
  onDisplayCPM: (v: number) => void;
  onVideoCPM: (v: number) => void;
  onRisk: (v: RiskScenario) => void;
}

const RISKS: RiskScenario[] = ['conservative', 'moderate', 'optimistic'];

export const BasicInputs = ({
  displayCPM,
  videoCPM,
  risk,
  onDisplayCPM,
  onVideoCPM,
  onRisk,
}: BasicInputsProps) => {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">How you monetise</h3>
          <p className="text-xs text-muted-foreground">
            Your typical CPMs set what each recovered impression is worth
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Display CPM</Label>
              <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-base font-bold text-primary tabular-nums">
                ${displayCPM.toFixed(2)}
              </span>
            </div>
            <Slider
              min={1}
              max={15}
              step={0.25}
              value={[displayCPM]}
              onValueChange={([v]) => onDisplayCPM(v)}
              className="pt-1"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>$1.00</span>
              <span>$15.00</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Video CPM</Label>
              <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-base font-bold text-primary tabular-nums">
                ${videoCPM.toFixed(2)}
              </span>
            </div>
            <Slider
              min={5}
              max={40}
              step={0.5}
              value={[videoCPM]}
              onValueChange={([v]) => onVideoCPM(v)}
              className="pt-1"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>$5.00</span>
              <span>$40.00</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">How cautious should we be?</Label>
          <p className="text-xs text-muted-foreground">
            We&rsquo;d rather under-promise. This scales the whole estimate up or down.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {RISKS.map((r) => {
              const active = r === risk;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRisk(r)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-all ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{RISK_SCENARIO_DESCRIPTIONS[risk]}</p>
        </div>
      </div>
    </Card>
  );
};
