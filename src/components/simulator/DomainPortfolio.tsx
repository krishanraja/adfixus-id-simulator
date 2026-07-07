import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Globe, Plus, Trash2 } from 'lucide-react';
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

/**
 * The two things about their sites a publisher genuinely knows: how big the
 * audience is, and how Apple-heavy it is. Ad density and the display/video mix
 * are inferred from open-web benchmarks (seeded per vertical), so they are not
 * asked here. Running a portfolio is a minority case, so the property name and
 * add/remove controls live in a collapsed "more than one site?" reveal - the
 * default single-site view shows just audience + Apple share.
 */
export const DomainPortfolio = ({ domains, onAdd, onUpdate, onRemove }: DomainPortfolioProps) => {
  const [multiOpen, setMultiOpen] = useState(false);
  const multi = domains.length > 1;
  const totalPageviews = domains.reduce((s, d) => s + d.monthlyPageviews, 0);

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Your audience</h3>
          <p className="text-xs text-muted-foreground">
            How big it is, and how much of it is on Apple
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {domains.map((d, i) => (
          <div
            key={d.id}
            className="rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/30"
          >
            {/* Name + remove only matter once there's a portfolio to keep straight. */}
            {multi && (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(d.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${d.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

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
                  <Label className="text-xs text-muted-foreground">
                    Your Apple audience (Safari &amp; iOS)
                  </Label>
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
                  The slice that&rsquo;s hardest to recognise once cookies expire &ndash;
                  and the biggest prize a durable ID wins back. Most open-web sites sit
                  around 30&ndash;45%.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {multi ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span className="text-muted-foreground">{domains.length} sites in portfolio</span>
            <span className="font-semibold tabular-nums">
              {formatNumberWithCommas(totalPageviews)} total PV/mo
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add another site
          </Button>
        </div>
      ) : (
        <Collapsible open={multiOpen} onOpenChange={setMultiOpen} className="mt-4">
          <CollapsibleTrigger className="group inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${multiOpen ? 'rotate-180' : ''}`} />
            Run more than one site?
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Add each property and we&rsquo;ll model the whole portfolio together.
            </p>
            <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add another site
            </Button>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
};
