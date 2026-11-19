/**
 * How many rubric items each role may leave unevaluated. Following the
 * Resolución sobre los TFM of the MUII, the tutor may leave up to two items of
 * the report unevaluated and the grade is rescaled over the remaining items.
 * Committee members must evaluate every item.
 */
export const MAX_UNEVALUATED_ITEMS = {
  tutor: 2,
  jury: 0,
} as const;