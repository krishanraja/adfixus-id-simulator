import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { formatNumberWithCommas } from '@/utils/formatting';
import type { DomainDraft } from '@/hooks/useIdSimulator';

interface DomainPortfolioProps {
  domains: DomainDraft[];
  onAdd: () => void;
  onUpdate: (id: string, partial: Partial<DomainDraft>) => void;
  onRemove: (id: string) => void;
}

const parsePv = (raw: string): number => {
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

export const DomainPortfolio = ({ domains, onAdd, onUpdate, onRemove }: DomainPortfolioProps) => {
  const totalPageviews = domains.reduce((s, d) => s + d.monthlyPageviews, 0);

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Your properties</h3>
            <p className="text-xs text-muted-foreground">
              Where your audience actually shows up - one site or a whole portfolio
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add property
        </Button>
      </div>

      <div className="space-y-4">
        {domains.map((d, i) => (
          <div
            key={d.id}
            className="rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/30"
          >
            <div className="mb-3 flex items-center gap-2">
              <Input
                value={d.name}
                onChange={(e) => onUpdate(d.id, { name: e.target.value })}
                className="h-9 max-w-[240px] font-medium"
                placeholder={`Property ${i + 1}`}
                aria-label="Property name"
              />
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="secondary" className="tabular-nums">
                  {formatNumberWithCommas(d.monthlyPageviews)} PV/mo
                </Badge>
                {domains.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(d.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${d.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Monthly pageviews</Label>
                <Input
                  inputMode="numeric"
                  value={formatNumberWithCommas(d.monthlyPageviews)}
                  onChange={(e) => onUpdate(d.id, { monthlyPageviews: parsePv(e.target.value) })}
                  className="h-9 tabular-nums"
                  aria-label="Monthly pageviews"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Safari / iOS share</Label>
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {Math.round(d.safariShare * 100)}%
                  </span>
                </div>
                <Slider
                  min={10}
                  max={70}
                  step={1}
                  value={[Math.round(d.safariShare * 100)]}
                  onValueChange={([v]) => onUpdate(d.id, { safariShare: v / 100 })}
                  className="pt-2"
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Safari&rsquo;s ITP wipes cookies within days, so this slice is
                  the hardest to recognise. Most open-web sites sit at 30&ndash;45%.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Ads per page</Label>
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {d.adsPerPage.toFixed(1)}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={8}
                  step={0.1}
                  value={[d.adsPerPage]}
                  onValueChange={([v]) => onUpdate(d.id, { adsPerPage: v })}
                  className="pt-2"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Display / video split</Label>
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {d.displayVideoSplit}% display
                  </span>
                </div>
                <Slider
                  min={10}
                  max={95}
                  step={5}
                  value={[d.displayVideoSplit]}
                  onValueChange={([v]) => onUpdate(d.id, { displayVideoSplit: v })}
                  className="pt-2"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {domains.length > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {domains.length} properties in portfolio
          </span>
          <span className="font-semibold tabular-nums">
            {formatNumberWithCommas(totalPageviews)} total PV/mo
          </span>
        </div>
      )}
    </Card>
  );
};
