import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { settleVariants, reducedVariants } from './motion';

interface AskStepProps {
  eyebrow?: string;
  /** The single question, phrased as a headline. */
  question: ReactNode;
  /** Optional one-line hint under the question. */
  hint?: ReactNode;
  /** The one tactile control (slider, segmented choice, input). */
  children: ReactNode;
  cta?: string;
  onContinue: () => void;
  /** Optional quiet "back" affordance. */
  onBack?: () => void;
}

/**
 * A single-question screen: one large, tactile control with a smart default so
 * the visitor can just hit Continue. Big touch targets, generous space, one
 * focal idea. Everything else in the model is inferred.
 */
export const AskStep = ({
  eyebrow,
  question,
  hint,
  children,
  cta = 'Continue',
  onContinue,
  onBack,
}: AskStepProps) => {
  const reduce = useReducedMotion();
  const variants = reduce ? reducedVariants : settleVariants;

  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          className="mb-6 text-xs font-medium uppercase tracking-widest text-primary"
        >
          {eyebrow}
        </motion.div>
      )}

      <motion.h2
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.05 }}
        className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl"
      >
        {question}
      </motion.h2>

      {hint && (
        <motion.p
          variants={variants}
          initial="initial"
          animate="animate"
          transition={reduce ? undefined : { delay: 0.1 }}
          className="mx-auto mt-4 max-w-lg text-base text-muted-foreground md:text-lg"
        >
          {hint}
        </motion.p>
      )}

      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.16 }}
        className="mt-12"
      >
        {children}
      </motion.div>

      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={reduce ? undefined : { delay: 0.24 }}
        className="mt-14 flex flex-col items-center gap-4"
      >
        <button
          onClick={onContinue}
          className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_35px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] hover:brightness-110 active:scale-[0.98]"
        >
          {cta}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back
          </button>
        )}
      </motion.div>
    </div>
  );
};
