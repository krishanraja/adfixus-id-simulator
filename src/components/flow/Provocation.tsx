import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { settleVariants, reducedVariants } from './motion';

interface ProvocationProps {
  /** Small uppercase eyebrow above the headline. */
  eyebrow?: string;
  /** The one bold editorial line (44–72px). Accepts rich content for accents. */
  headline: ReactNode;
  /** A single quiet supporting sentence. */
  support: ReactNode;
  /** Primary button label. */
  cta: string;
  onContinue: () => void;
}

/**
 * Step 1 of the guided flow: one bold editorial line that reframes identity for
 * the AI era, a single quiet supporting sentence, and one primary button.
 * Nothing else on screen.
 */
export const Provocation = ({
  eyebrow,
  headline,
  support,
  cta,
  onContinue,
}: ProvocationProps) => {
  const reduce = useReducedMotion();
  const variants = reduce ? reducedVariants : settleVariants;

  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          {eyebrow}
        </motion.div>
      )}

      <motion.h1
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.05 }}
        className="text-balance text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-[4.25rem]"
      >
        {headline}
      </motion.h1>

      <motion.p
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.12 }}
        className="mx-auto mt-7 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl"
      >
        {support}
      </motion.p>

      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.2 }}
        className="mt-11"
      >
        <button
          onClick={onContinue}
          className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_35px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] hover:brightness-110 active:scale-[0.98]"
        >
          {cta}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </div>
  );
};
