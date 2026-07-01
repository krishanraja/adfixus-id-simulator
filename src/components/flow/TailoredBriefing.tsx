import { useState } from 'react';
import { Compass, EyeOff, TrendingDown, ShieldCheck, Quote } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { STAKEHOLDER_LENSES, type StakeholderLens, type DomainProfile } from '@/core/intel';

interface TailoredBriefingProps {
  profile: DomainProfile;
  /** Compact single-card variant for the reveal screen; full for the drawer. */
  compact?: boolean;
  className?: string;
}

/**
 * The tailored recommendation, mirroring the AdFixus research playbook's output
 * (the "final prompt" structure): a context hook grounded in the business's own
 * world, the identity gap that is costing them, how a publisher-owned durable ID
 * closes it, and - calibrated to a Revenue / Ad-ops / Data stakeholder - a bold
 * PROOF METRIC against an industry benchmark. Every figure is a published AdFixus
 * benchmark; nothing company-specific is invented.
 */
export const TailoredBriefing = ({ profile, compact = false, className }: TailoredBriefingProps) => {
  const [lens, setLens] = useState<StakeholderLens>('revenue');
  const { archetype } = profile;
  const proof = archetype.proof[lens];
  const activeLens = STAKEHOLDER_LENSES.find((l) => l.key === lens)!;

  const header = (
    <div className="flex items-center gap-4">
      <BrandLogo domain={profile.domain} size={compact ? 44 : 52} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-lg font-semibold text-foreground">{profile.company}</span>
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            {archetype.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">
          Tailored identity-durability briefing
        </p>
      </div>
    </div>
  );

  const lensToggle = (
    <div>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-secondary/30 p-1">
        {STAKEHOLDER_LENSES.map((l) => {
          const active = l.key === lens;
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => setLens(l.key)}
              aria-pressed={active}
              className={[
                'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.3)]'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {l.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{activeLens.blurb}</p>
    </div>
  );

  const proofPanel = (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] to-transparent p-5">
      <div className="text-[11px] font-medium uppercase tracking-widest text-primary/80">
        Proof for {activeLens.label.toLowerCase()}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-5xl font-bold leading-none tracking-tight text-primary drop-shadow-[0_0_25px_hsl(var(--primary)/0.35)] md:text-6xl">
          {proof.stat}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{proof.statLabel}</p>
      <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          The benchmark it beats
        </div>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{proof.benchmark}</p>
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
        {proof.source}
      </p>
    </div>
  );

  if (compact) {
    return (
      <div
        className={[
          'rounded-2xl border border-border bg-card/60 p-5 text-left backdrop-blur-sm',
          className ?? '',
        ].join(' ')}
      >
        {header}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{archetype.context}</p>
        <div className="mt-4 rounded-xl border border-border/60 bg-secondary/20 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary/80">
            <EyeOff className="h-3.5 w-3.5" /> Your identity gap
          </div>
          <p className="mt-1 text-sm leading-snug text-foreground/90">{profile.identityGap}</p>
        </div>
        <div className="mt-4">{lensToggle}</div>
        <div className="mt-4">{proofPanel}</div>
      </div>
    );
  }

  const blocks = [
    { icon: Compass, title: 'The moment you’re in', body: archetype.context },
    { icon: EyeOff, title: 'Where your audience goes dark', body: profile.identityGap },
    { icon: TrendingDown, title: 'What it’s costing you', body: archetype.whatItCosts },
    {
      icon: ShieldCheck,
      title: 'How AdFixus closes it',
      body: profile.angle && profile.match === 'known' ? profile.angle : archetype.adfixusMapping,
    },
  ];

  return (
    <div
      className={['rounded-3xl border border-border bg-card/60 p-6 md:p-8', className ?? ''].join(' ')}
    >
      <div className="flex flex-col gap-5 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
        {header}
        <div className="md:w-[320px]">{lensToggle}</div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          {blocks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <div className="md:sticky md:top-4 md:self-start">{proofPanel}</div>
      </div>

      {profile.match !== 'known' && (
        <p className="mt-5 text-[11px] leading-snug text-muted-foreground">
          Tailored from open-web benchmarks for your vertical. Enter a specific
          brand domain for a sharper read, or book a conversation for an audit
          grounded in your live identity stack.
        </p>
      )}
    </div>
  );
};
