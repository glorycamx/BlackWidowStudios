/** Motion language: slow confidence, never bouncy. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_IO = [0.65, 0, 0.35, 1] as const;

export const DUR = {
  micro: 0.18,
  page: 0.4,
  cinematic: 0.9,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
