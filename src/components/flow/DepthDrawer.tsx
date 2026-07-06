import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface DepthDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Heading shown in the drawer's slim top bar. */
  title?: string;
  children: ReactNode;
}

/**
 * The progressive-depth surface. A quiet affordance elsewhere opens this panel,
 * which slides + scales in to reveal ALL the existing richness - full sliders,
 * domain portfolio, advanced panel, waterfall, ramp chart, breakdowns -
 * completely unchanged. Nothing is removed; it is simply hidden by default and
 * reachable in one click.
 *
 * It renders in normal document flow (not `position: fixed`) so it contributes
 * to `#root` scrollHeight - which keeps the iframe-embed height reporting
 * correct when the full picture is open.
 */
export const DepthDrawer = ({
  open,
  onClose,
  title = 'The full picture',
  children,
}: DepthDrawerProps) => {
  const reduce = useReducedMotion();

  // On open, bring the panel into view from the top. This must depend ONLY on
  // the open transition - not on `onClose`, whose reference changes on every
  // parent render (e.g. adjusting a slider inside the drawer). Including it here
  // would re-run this effect on every interaction and yank the page to the top.
  useEffect(() => {
    if (!open) return;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [open, reduce]);

  // Allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const initial = reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 };
  const animate = reduce
    ? { opacity: 1, transition: { duration: 0.001 } }
    : {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 240, damping: 28 },
      };
  const exit = reduce
    ? { opacity: 0, transition: { duration: 0.001 } }
    : { opacity: 0, y: 16, scale: 0.985, transition: { duration: 0.2, ease: 'easeIn' as const } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="depth-drawer"
          className="relative z-[60] min-h-dvh-safe origin-top bg-background"
          initial={initial}
          animate={animate}
          exit={exit}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Slim sticky top bar with a single close affordance */}
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {title}
              </span>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>

          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
