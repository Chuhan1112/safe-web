/**
 * Single motion vocabulary for the workspace.
 *
 * Why this file exists: before it, every hover/press/morph picked its own
 * Tailwind default (`cubic-bezier(0.4, 0, 0.2, 1)` @150ms), so the app had no
 * shared sense of "how fast" or "how springy". Colour, press feedback and
 * panel entry all spoke different dialects.
 *
 * Rules of this vocabulary (mirrors the UI-motion spec):
 * - Springs everywhere, a tiny overshoot at most. Nothing bouncy.
 * - One accent curve per *role*, not per component.
 * - Motion settles fast: nothing interactive may exceed `move` (220ms).
 *
 * The CSS side of these tokens lives in `src/globals.css` (`--ease-*`,
 * `--dur-*`) and is surfaced as Tailwind utilities in `tailwind.config.js`
 * (`ease-snap`, `duration-move`, ...). Keep all three in sync.
 */
import type { Transition } from "motion/react"

/** CSS timing functions. Must match the `--ease-*` custom properties. */
export const EASE = {
  /** No overshoot. Hover, colour, opacity, focus rings. */
  snap: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  /** ~3% overshoot on release. Press, scale, position. */
  spring: "cubic-bezier(0.34, 1.32, 0.44, 1)",
  /** Bounded overshoot, slower travel. Indicator that leads its track. */
  liquid: "cubic-bezier(0.32, 1.5, 0.5, 1)",
  /** Decelerating, no overshoot, so text stays legible while it moves. */
  enter: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const

/** Durations in ms. Must match the `--dur-*` custom properties. */
export const DURATION = {
  /** Press-in. Must read as instantaneous. */
  press: 90,
  /** Colour / opacity hover. */
  snap: 140,
  /** Geometry morphs: size, position, radius. */
  move: 220,
  /** First paint of a panel or list item. */
  enter: 280,
} as const

export type MotionEase = keyof typeof EASE
export type MotionDuration = keyof typeof DURATION

/**
 * `motion/react` spring configs for JS-driven motion.
 *
 * Damping ratios are held between 0.77 and 0.95 so the overshoot stays in the
 * "tiny" band (~0.1%–3%) instead of reading as a bounce. `liquid` is set apart
 * by travelling slower (lower stiffness), not by bouncing harder.
 */
export const SPRING = {
  snap: { type: "spring", stiffness: 520, damping: 36, mass: 0.7 },
  spring: { type: "spring", stiffness: 420, damping: 30, mass: 0.9 },
  liquid: { type: "spring", stiffness: 300, damping: 27, mass: 1 },
} satisfies Record<string, Transition>

export type SpringName = keyof typeof SPRING

/** Tailwind class fragments for the common combinations. */
export const MOTION = {
  /** Colour-only hover. */
  hover: "transition-colors duration-snap ease-snap",
  /** Geometry morph: position, size, radius. */
  morph: "transition-transform duration-move ease-spring",
  /** Panel / list entry. */
  enter: "transition-opacity duration-enter ease-enter",
} as const
