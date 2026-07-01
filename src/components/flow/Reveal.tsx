import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { settleVariants, reducedVariants } from './motion';

interface RevealProps {
  eyebrow?: ReactNode;
  /** The numeric target the hero number counts up to. */
  value: number;
  /** Formats the animated value into the hero string (e.g. formatCurrency). */
  format: (n: number) => string;
  /** Small suffix rendered beside the number (e.g. "/yr"). */
  suffix?: string;
  /** One line of meaning beneath the number. */
  meaning: ReactNode;
  /** Primary CTA label (calm next step). */
  ctaLabel: string;
  /** Primary CTA link (book a conversation). */
  ctaHref: string;
  /** Optional quiet secondary action to reveal full depth. */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * The payoff screen: one hero number that counts up, a single line of meaning,
 * and one calm CTA. A small settle animation makes the moment land. This screen
 * should feel good - it is the emotional peak of the flow.
 */
export const Reveal = ({
  eyebrow,
  value,
  format,
  suffix,
  meaning,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  onSecondary,
}: RevealProps) => {
  const reduce = useReducedMotion();
  const variants = reduce ? reducedVariants : settleVariants;
  const animated = useAnimatedNumber(value, reduce ? 1 : 1100);

  return (
    <div className="mx-auto max-w-3xl text-center">
      {/* ambient glow behind the number */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)' }}
      />

      {eyebrow && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary"
        >
          {eyebrow}
        </motion.div>
      )}

      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.08 }}
        className="flex items-start justify-center text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
      >
        <span className="text-[4rem] font-bold leading-none tracking-tight tabular-nums sm:text-8xl md:text-[8.5rem]">
          {format(animated)}
        </span>
        {suffix && (
          <span className="ml-2 mt-3 text-2xl font-normal text-muted-foreground md:mt-5 md:text-4xl">
            {suffix}
          </span>
        )}
      </motion.div>

      <motion.p
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.18 }}
        className="mx-auto mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl"
      >
        {meaning}
      </motion.p>

      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.28 }}
        className="mt-11 flex flex-col items-center gap-5"
      >
        <a
          href={ctaHref}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_35px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] hover:brightness-110 active:scale-[0.98]"
        >
          <CalendarCheck className="h-5 w-5" />
          {ctaLabel}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </a>

        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {secondaryLabel}
          </button>
        )}
      </motion.div>
    </div>
  );
};
