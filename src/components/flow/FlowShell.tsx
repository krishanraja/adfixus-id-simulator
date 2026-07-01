import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { AdfixusLogo } from '@/components/brand/AdfixusLogo';
import { stepVariants, reducedVariants } from './motion';

interface FlowShellProps {
  /** Zero-based index of the visible step; used to key the transition + dots. */
  step: number;
  /** Total number of steps in the guided path (for the progress dots). */
  stepCount: number;
  /** Jump to a step when a dot is clicked (only backwards is offered). */
  onStepSelect?: (index: number) => void;
  children: ReactNode;
}

/**
 * The shared guided-flow shell: a full-viewport, centred, dark stage that shows
 * exactly one step at a time. A tiny fixed AdFixus wordmark sits top-left; slim
 * progress dots sit top-right. Step transitions are a gentle fade + 12px y +
 * slight scale on a spring (~0.4s), and collapse to a plain crossfade when the
 * visitor prefers reduced motion.
 *
 * Identical structure/name across all three AdFixus tools - this is what makes
 * them feel like one product.
 */
export const FlowShell = ({ step, stepCount, onStepSelect, children }: FlowShellProps) => {
  const reduce = useReducedMotion();
  const variants = reduce ? reducedVariants : stepVariants;

  return (
    <div className="hero-gradient relative flex min-h-dvh-safe flex-col overflow-x-hidden bg-background text-foreground">
      {/* Fixed wordmark, top-left */}
      <a
        href="https://www.adfixus.com"
        target="_blank"
        rel="noreferrer"
        className="fixed left-5 top-5 z-50 transition-opacity hover:opacity-80 md:left-8 md:top-7"
        aria-label="AdFixus"
      >
        <AdfixusLogo height={24} />
      </a>

      {/* Slim progress dots, top-right */}
      {stepCount > 1 && (
        <div className="fixed right-5 top-6 z-50 flex items-center gap-2 md:right-8 md:top-8">
          {Array.from({ length: stepCount }).map((_, i) => {
            const active = i === step;
            const reachable = i < step && !!onStepSelect;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Step ${i + 1}`}
                aria-current={active ? 'step' : undefined}
                disabled={!reachable}
                onClick={reachable ? () => onStepSelect?.(i) : undefined}
                className={[
                  'h-1.5 rounded-full transition-all duration-300',
                  active
                    ? 'w-6 bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]'
                    : i < step
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted-foreground/25',
                  reachable ? 'cursor-pointer hover:bg-primary/70' : 'cursor-default',
                ].join(' ')}
              />
            );
          })}
        </div>
      )}

      {/* The stage: one step, centred */}
      <main className="flex flex-1 items-center justify-center px-6 py-24 md:px-8">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
