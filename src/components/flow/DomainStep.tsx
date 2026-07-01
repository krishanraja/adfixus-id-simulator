import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  resolveDomainProfile,
  emptyProfile,
  type DomainProfile,
} from '@/core/intel';
import { settleVariants, reducedVariants } from './motion';

interface DomainStepProps {
  /** Domain the visitor has already entered (so returning to the step is sticky). */
  initialValue?: string;
  /** Fires with the resolved profile when the visitor continues (or skips). */
  onContinue: (profile: DomainProfile, rawInput: string) => void;
  onBack?: () => void;
}

/**
 * The domain-entry step: the visitor types their website and the tool instantly
 * recognises the business - real logo, vertical, and the assumptions it will use
 * - before a single slider is touched. This is the "magic populate" moment; from
 * here the whole audit is tailored to them. Everything runs in the browser.
 */
export const DomainStep = ({ initialValue = '', onContinue, onBack }: DomainStepProps) => {
  const reduce = useReducedMotion();
  const variants = reduce ? reducedVariants : settleVariants;

  const [value, setValue] = useState(initialValue);
  const profile = useMemo(() => resolveDomainProfile(value), [value]);
  const recognised = profile.domain !== null;

  // Debounce the domain used to load the logo so we don't hammer favicon
  // services on every keystroke.
  const [logoDomain, setLogoDomain] = useState<string | null>(profile.domain);
  useEffect(() => {
    const t = setTimeout(() => setLogoDomain(profile.domain), 450);
    return () => clearTimeout(t);
  }, [profile.domain]);

  const proceed = () => onContinue(recognised ? profile : emptyProfile(value), value);

  const seeds = profile.archetype.seeds;
  const chips = [
    `Safari/iOS ${Math.round(seeds.safariShare * 100)}%`,
    `${seeds.displayVideoSplit}% display`,
    `$${seeds.displayCPM.toFixed(2)} display CPM`,
    `${profile.anonPct}% anonymous`,
  ];

  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        className="mb-6 text-xs font-medium uppercase tracking-widest text-primary"
      >
        Start with your site
      </motion.div>

      <motion.h2
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.05 }}
        className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl"
      >
        What&rsquo;s your <span className="text-primary">website</span>?
      </motion.h2>

      <motion.p
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.1 }}
        className="mx-auto mt-4 max-w-lg text-base text-muted-foreground md:text-lg"
      >
        We&rsquo;ll recognise your business and tailor the whole audit to it -
        your challenges, your numbers, your proof. Nothing leaves your browser.
      </motion.p>

      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.16 }}
        className="mx-auto mt-10 max-w-md"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3 focus-within:border-primary/60 focus-within:shadow-[0_0_25px_hsl(var(--primary)/0.2)]">
          <span className="select-none text-muted-foreground">https://</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') proceed();
            }}
            placeholder="yourdomain.com"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Your website domain"
            className="w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </motion.div>

      {/* Recognition card - appears once we have a usable domain. */}
      {recognised && (
        <motion.div
          key={profile.domain}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto mt-6 max-w-md rounded-2xl border border-primary/25 bg-primary/[0.05] p-5 text-left"
        >
          <div className="flex items-center gap-4">
            <BrandLogo domain={logoDomain} size={56} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-lg font-semibold text-foreground">
                  {profile.company}
                </span>
                {profile.match === 'known' && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                    <Check className="h-3 w-3" /> recognised
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Modelling this as a{' '}
                <span className="font-medium text-foreground">
                  {profile.archetype.label.toLowerCase()}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 border-t border-border/60 pt-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Pre-filled from open-web benchmarks for your vertical
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                Every one of these is yours to change next - this is just a
                grounded starting point.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.24 }}
        className="mt-10 flex flex-col items-center gap-4"
      >
        <button
          onClick={proceed}
          className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_35px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] hover:brightness-110 active:scale-[0.98]"
        >
          {recognised ? 'Tailor my audit' : 'Continue'}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {onBack && (
            <button onClick={onBack} className="transition-colors hover:text-foreground">
              Back
            </button>
          )}
          {!recognised && value.trim().length > 0 && (
            <span className="text-xs">Enter a domain like <span className="text-foreground">yourdomain.com</span></span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
