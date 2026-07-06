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
  /** Optional panel rendered between the meaning line and the CTAs. */
  panel?: ReactNode;
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
  panel,
}: RevealProps) => {
  const reduce = useReducedMotion();
  const variants = reduce ? reducedVariants : settleVariants;
  const animated = useAnimatedNumber(value, reduce ? 1 : 1100);

  // With a side panel (the tailored briefing) the payoff and the briefing sit
  // side by side on wide screens so the whole reveal fits within one viewport;
  // without one, the number stays centred and cinematic.
  const withPanel = Boolean(panel);

  const eyebrowEl = eyebrow && (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary"
    >
      {eyebrow}
    </motion.div>
  );

  const numberEl = (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      transition={reduce ? undefined : { delay: 0.08 }}
      className={`flex items-start text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)] ${
        withPanel ? 'justify-center lg:justify-start' : 'justify-center'
      }`}
    >
      <span
        className={`font-bold leading-none tracking-tight tabular-nums ${
          withPanel ? 'text-[3.5rem] sm:text-7xl' : 'text-[4rem] sm:text-8xl md:text-[8.5rem]'
        }`}
      >
        {format(animated)}
      </span>
      {suffix && (
        <span className="ml-2 mt-2 text-2xl font-normal text-muted-foreground md:mt-4 md:text-3xl">
          {suffix}
        </span>
      )}
    </motion.div>
  );

  const meaningEl = (
    <motion.p
      variants={variants}
      initial="initial"
      animate="animate"
      transition={reduce ? undefined : { delay: 0.18 }}
      className={`text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl ${
        withPanel ? 'mt-6 max-w-xl' : 'mx-auto mt-8 max-w-xl'
      }`}
    >
      {meaning}
    </motion.p>
  );

  const ctaEl = (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      transition={reduce ? undefined : { delay: 0.28 }}
      className={`flex flex-col gap-4 ${withPanel ? 'mt-8 items-center lg:items-start' : 'mt-11 items-center'}`}
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
  );

  // ambient glow behind the number
  const glow = (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
      style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)' }}
    />
  );

  if (withPanel) {
    return (
      <div className="relative mx-auto grid max-w-5xl items-center gap-8 text-center lg:grid-cols-2 lg:gap-12 lg:text-left">
        {glow}
        <div>
          {eyebrowEl}
          {numberEl}
          {meaningEl}
          {ctaEl}
        </div>
        {/* On narrow screens the briefing is one tap away in the console's
            Briefing tab, so it is hidden here to keep the reveal no-scroll. */}
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          transition={reduce ? undefined : { delay: 0.24 }}
          className="mx-auto hidden w-full max-w-md lg:mx-0 lg:block"
        >
          {panel}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl text-center">
      {glow}
      {eyebrowEl}
      {numberEl}
      {meaningEl}
      {ctaEl}
    </div>
  );
};
