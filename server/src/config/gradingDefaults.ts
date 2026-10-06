/**
 * Default share of the final grade for each role, following the official UGR
 * rule for the TFM (guía docente M50/56/3/24): the evaluation committee counts
 * for 70% and the tutor for 30%.
 *
 * The coordinator can still set any split per degree in the rubric editor.
 * These values only apply when no rubric has been configured yet.
 */
export const DEFAULT_ROLE_WEIGHTS = {
  tutor: 0.3,
  jury: 0.7,
} as const;