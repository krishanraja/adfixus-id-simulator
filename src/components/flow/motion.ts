// Shared motion vocabulary for the AdFixus guided-flow shell.
//
// Keep this file identical across the three AdFixus tools so every surface
// shares one rhythm: a gentle fade + 12px rise + slight scale, spring easing,
// ~0.4s. All motion respects `prefers-reduced-motion` via `useReducedMotion`
// in the components that consume these variants.

import type { Transition, Variants } from 'framer-motion';

/** Canonical spring for step transitions (~0.4s settle). */
export const SPRING: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

/** Enter/exit for a single guided step. Fade + 12px y + slight scale. */
export const stepVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING },
  exit: { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** A quiet element settling into place (hero number, CTA, etc.). */
export const settleVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING },
};

/** Reduced-motion equivalents: opacity only, near-instant. */
export const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.001 } },
  exit: { opacity: 0, transition: { duration: 0.001 } },
};
