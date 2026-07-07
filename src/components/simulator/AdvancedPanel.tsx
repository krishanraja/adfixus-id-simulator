import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, SlidersHorizontal, Radar, Briefcase, RotateCcw } from 'lucide-react';
import { AssumptionSlider } from './AssumptionSlider';
import { DEFAULTS, type IdSimulatorState } from '@/hooks/useIdSimulator';

interface AdvancedPanelProps {
  state: IdSimulatorState;
  patch: (partial: Partial<IdSimulatorState>) => void;
  patchReadiness: (field: keyof IdSimulatorState['readiness'], value: number | undefined) => void;
  onResetAll: () => void;
  modifiedCount: number;
}

const pct = (v: number) => `${Math.round(v)}%`;

export const AdvancedPanel = ({
  state,
  patch,
  patchReadiness,
  onResetAll,
  modifiedCount,
}: AdvancedPanelProps) => {
  const [open, setOpen] = useState(false);
  const r = state.readiness;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-secondary/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Refine the assumptions</h3>
              <p className="text-xs text-muted-foreground">
                Optional - every benchmark is yours to challenge and adjust
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {modifiedCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {modifiedCount} changed
              </span>
            )}
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-6 border-t border-border p-5">
            {modifiedCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={onResetAll} className="gap-1.5 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset all to defaults
                </Button>
              </div>
            )}

            {/* Addressability & CPM economics */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Radar className="h-4 w-4 text-primary" /> Addressability & CPM economics
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <AssumptionSlider
                  label="Baseline addressability"
                  description="Share of total inventory addressable today"
                  value={state.baselineAddressability * 100}
                  defaultValue={DEFAULTS.baselineAddressability * 100}
                  min={40}
                  max={90}
                  step={1}
                  formatValue={pct}
                  onChange={(v) => patch({ baselineAddressability: v / 100 })}
                  tooltipContent="What fraction of impressions can currently be matched to an ID. The remainder is sold contextually at a discount."
                />
                <AssumptionSlider
                  label="Recovered Safari addressability"
                  description="Safari addressability restored by a durable ID"
                  value={state.targetSafariAddressability * 100}
                  defaultValue={DEFAULTS.targetSafariAddressability * 100}
                  min={10}
                  max={60}
                  step={1}
                  formatValue={pct}
                  onChange={(v) => patch({ targetSafariAddressability: v / 100 })}
                  tooltipContent="A durable ID re-identifies returning Safari users beyond the 7-day limit. A conservative target is ~35%."
                />
                <AssumptionSlider
                  label="CPM uplift factor"
                  description="Premium on newly addressable inventory"
                  value={state.cpmUpliftFactor * 100}
                  defaultValue={DEFAULTS.cpmUpliftFactor * 100}
                  min={5}
                  max={50}
                  step={1}
                  formatValue={pct}
                  onChange={(v) => patch({ cpmUpliftFactor: v / 100 })}
                  tooltipContent="Addressable impressions command higher CPMs. Industry benchmarks show 20-30% uplift versus contextual."
                />
                <AssumptionSlider
                  label="Contextual CPM ratio"
                  description="Contextual CPM as a share of addressable CPM"
                  value={state.contextualCpmRatio * 100}
                  defaultValue={DEFAULTS.contextualCpmRatio * 100}
                  min={50}
                  max={95}
                  step={1}
                  formatValue={pct}
                  onChange={(v) => patch({ contextualCpmRatio: v / 100 })}
                  tooltipContent="How much of the addressable CPM you capture when selling the same impression contextually. Typically ~72%."
                />
                <AssumptionSlider
                  label="CDP monthly savings"
                  description="Data-platform cost saved from ID de-duplication"
                  value={state.cdpMonthlySavings}
                  defaultValue={DEFAULTS.cdpMonthlySavings}
                  min={0}
                  max={20000}
                  step={500}
                  formatValue={(v) => `$${(v / 1000).toFixed(1)}K`}
                  onChange={(v) => patch({ cdpMonthlySavings: v })}
                  tooltipContent="Collapsing ID bloat (from ~3.5 IDs/user to ~1.1) shrinks CDP/martech storage and processing costs."
                />
              </div>
            </div>

            <Separator />

            {/* Business readiness */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-primary" /> Business readiness
              </h4>
              <p className="text-xs text-muted-foreground">
                How smoothly your team executes. Lower readiness discounts the modelled uplift.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <AssumptionSlider
                  label="Sales readiness"
                  description="Team trained to sell addressable inventory"
                  value={(r.salesReadiness ?? 0.75) * 100}
                  defaultValue={75}
                  min={40}
                  max={100}
                  step={5}
                  formatValue={pct}
                  onChange={(v) => patchReadiness('salesReadiness', v / 100)}
                  tooltipContent="Higher readiness realises more of the CPM uplift and adoption faster."
                />
                <AssumptionSlider
                  label="Advertiser buy-in"
                  description="Demand-side appetite for addressable buys"
                  value={(r.advertiserBuyIn ?? 0.8) * 100}
                  defaultValue={80}
                  min={40}
                  max={100}
                  step={5}
                  formatValue={pct}
                  onChange={(v) => patchReadiness('advertiserBuyIn', v / 100)}
                  tooltipContent="Stronger buy-in means more of the recovered inventory is actually monetised at premium rates."
                />
                <AssumptionSlider
                  label="Organisational ownership"
                  description="Clear internal owner driving rollout"
                  value={(r.organizationalOwnership ?? 0.8) * 100}
                  defaultValue={80}
                  min={40}
                  max={100}
                  step={5}
                  formatValue={pct}
                  onChange={(v) => patchReadiness('organizationalOwnership', v / 100)}
                  tooltipContent="Dedicated ownership raises adoption of the deployed capability."
                />
                <AssumptionSlider
                  label="Market conditions"
                  description="Overall ad-market demand environment"
                  value={(r.marketConditions ?? 0.85) * 100}
                  defaultValue={85}
                  min={50}
                  max={100}
                  step={5}
                  formatValue={pct}
                  onChange={(v) => patchReadiness('marketConditions', v / 100)}
                  tooltipContent="A softer market dampens realised CPM uplift and CDP savings."
                />
                <AssumptionSlider
                  label="Training coverage"
                  description="Ad-ops fluency with the new workflow"
                  value={(r.trainingGaps ?? 0.75) * 100}
                  defaultValue={75}
                  min={40}
                  max={100}
                  step={5}
                  formatValue={pct}
                  onChange={(v) => patchReadiness('trainingGaps', v / 100)}
                  tooltipContent="Better training lifts adoption and addressability efficiency."
                />
                <AssumptionSlider
                  label="Integration reliability"
                  description="Technical integrations landing cleanly"
                  value={(r.integrationDelays ?? 0.8) * 100}
                  defaultValue={80}
                  min={40}
                  max={100}
                  step={5}
                  formatValue={pct}
                  onChange={(v) => patchReadiness('integrationDelays', v / 100)}
                  tooltipContent="Fewer integration delays means addressability efficiency is realised sooner."
                />
                <AssumptionSlider
                  label="Resource availability"
                  description="People available to run the programme"
                  value={(r.resourceAvailability ?? 0.75) * 100}
                  defaultValue={75}
                  min={40}
                  max={100}
                  step={5}
                  formatValue={pct}
                  onChange={(v) => patchReadiness('resourceAvailability', v / 100)}
                  tooltipContent="Thin resourcing slows adoption and can extend the ramp period."
                />
                <AssumptionSlider
                  label="Technical deployment"
                  description="Months to fully deploy the durable ID"
                  value={r.technicalDeploymentMonths ?? 9}
                  defaultValue={9}
                  min={3}
                  max={18}
                  step={1}
                  formatValue={(v) => `${Math.round(v)} mo`}
                  onChange={(v) => patchReadiness('technicalDeploymentMonths', v)}
                  tooltipContent="Sets the ramp-up curve on the 12-month projection. Faster deployment reaches full value sooner."
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
