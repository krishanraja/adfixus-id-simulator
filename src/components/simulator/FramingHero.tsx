import { ArrowDown } from 'lucide-react';
import { formatPercentage } from '@/utils/formatting';
import type { AudienceVisibility } from '@/hooks/useIdSimulator';

interface FramingHeroProps {
  visibility: AudienceVisibility;
  onExplore: () => void;
}

/**
 * The opening provocation. Leads with the AI-era reality for an open-web
 * business - the anonymous majority going dark, cookies decaying under
 * Safari/ITP, AI crawlers eating traffic - then makes it personal with a single
 * striking visual: how much of *this* audience is already invisible.
 *
 * Insight first. The numbers here are evidence for the idea, not a calculator.
 */
export const FramingHero = ({ visibility, onExplore }: FramingHeroProps) => {
  const invisiblePct = Math.round(visibility.invisibleShare * 100);
  const visiblePct = Math.max(0, 100 - invisiblePct);

  return (
    <section className="relative overflow-hidden">
      {/* ambient field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% -10%, hsl(var(--primary) / 0.14) 0%, transparent 55%)',
        }}
      />

      <div className="mx-auto max-w-3xl pt-10 text-center md:pt-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Identity-durability audit
        </div>

        <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-[1.1] tracking-tight md:text-5xl">
          On the AI-saturated web, most of your audience is already{' '}
          <span className="gradient-text">invisible to you</span>.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Search traffic is collapsing as AI assistants answer in place. Crawlers
          consume a rising share of requests that are not human. And under
          Safari, ITP and cookie decay, the anonymous majority - everyone who
          isn&rsquo;t logged in - goes dark within days. Your logged-in core is
          real, but it&rsquo;s often only 10&ndash;30% of who shows up.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          The question is no longer <em>how do we target</em> - it&rsquo;s{' '}
          <span className="font-medium text-foreground">
            do we still recognise the humans on our own site
          </span>
          .
        </p>
      </div>

      {/* The striking visual: a single bar the reader can feel. */}
      <div className="mx-auto mt-12 max-w-3xl">
        <VisibilityBar invisiblePct={invisiblePct} visiblePct={visiblePct} />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <figure className="rounded-xl border border-primary/25 bg-primary/[0.06] p-5">
            <figcaption className="text-xs font-medium uppercase tracking-wide text-primary/80">
              Going dark today
            </figcaption>
            <div className="mt-1 text-4xl font-bold tabular-nums text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)] md:text-5xl">
              {formatPercentage(invisiblePct, 0)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              of your audience can&rsquo;t be recognised or measured, on a typical
              open-web stack.
            </p>
          </figure>
          <figure className="rounded-xl border border-border bg-card/60 p-5">
            <figcaption className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Still recognisable
            </figcaption>
            <div className="mt-1 text-4xl font-bold tabular-nums text-foreground md:text-5xl">
              {formatPercentage(visiblePct, 0)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              addressable right now - the sliver advertisers can still credit and
              buy against.
            </p>
          </figure>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          That figure is an industry default. See what it looks like for your
          business.
        </p>
        <button
          onClick={onExplore}
          className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          See your own situation
          <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>
    </section>
  );
};

const VisibilityBar = ({
  invisiblePct,
  visiblePct,
}: {
  invisiblePct: number;
  visiblePct: number;
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <span>Your monthly audience</span>
      <span>100%</span>
    </div>
    <div className="flex h-14 w-full overflow-hidden rounded-xl border border-border">
      {/* Invisible majority - hatched, receding into the dark. */}
      <div
        className="relative flex items-center justify-center transition-[flex-basis] duration-700"
        style={{
          flexBasis: `${invisiblePct}%`,
          background:
            'repeating-linear-gradient(135deg, hsl(0 0% 10%) 0px, hsl(0 0% 10%) 8px, hsl(0 0% 7%) 8px, hsl(0 0% 7%) 16px)',
        }}
      >
        {invisiblePct >= 22 && (
          <span className="px-2 text-xs font-medium text-muted-foreground">
            Invisible · anonymous & unmeasured
          </span>
        )}
      </div>
      {/* The recognisable sliver - lit. */}
      <div
        className="relative flex items-center justify-center bg-gradient-to-r from-primary to-primary-glow transition-[flex-basis] duration-700"
        style={{ flexBasis: `${visiblePct}%` }}
      >
        {visiblePct >= 18 && (
          <span className="px-2 text-xs font-semibold text-primary-foreground">
            Recognised
          </span>
        )}
      </div>
    </div>
  </div>
);
