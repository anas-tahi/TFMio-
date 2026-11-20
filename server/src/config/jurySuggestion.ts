/** How many jury members to suggest for a work. */
export const DEFAULT_JURY_SIZE = 3;

/**
 * How many percentage points worse a candidate from a different department is
 * allowed to score, compared to the weakest of the naive top picks, and still
 * be swapped in to avoid an all-one-department jury. A smaller number means
 * the suggestion sticks closer to pure ranking; a larger number trades some
 * relevance for more department variety.
 */
export const MAX_SCORE_DROP_FOR_DIVERSITY = 15;