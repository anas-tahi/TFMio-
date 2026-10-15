/**
 * Threshold for the "similar topics" notice, as a cosine similarity (0 to 1).
 *
 * Measured with src/scripts/calibrateSimilarity.ts using nomic-embed-text on
 * nine hand-written pairs of topic texts:
 *   unrelated                      58% to 61%
 *   same area, different project   60% to 73%
 *   same idea, reworded            74% to 91%
 *
 * The model separates unrelated from related texts well, but it barely
 * separates "same area" from "same idea" (about 1.5 points apart). So this is
 * deliberately a soft notice, set just below the lowest reworded duplicate: it
 * lists topics worth a look and never blocks or claims a duplicate.
 */
export const SIMILAR_TOPIC_THRESHOLD = 0.7;

/** Most similar topics shown at once. */
export const MAX_SIMILAR_TOPICS = 3;