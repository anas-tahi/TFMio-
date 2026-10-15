/**
 * Builds the text we embed for a tutor's profile. Kept as a pure function
 * (no database, no AI call) so it can be unit tested on its own.
 */
export function buildTutorProfileText(profile: {
  department?: string;
  areas?: string[];
  bio?: string;
}): string {
  const parts: string[] = [];
  if (profile.department?.trim()) parts.push(`Department: ${profile.department.trim()}`);
  if (profile.areas?.length) parts.push(`Areas of expertise: ${profile.areas.join(", ")}`);
  if (profile.bio?.trim()) parts.push(`Bio: ${profile.bio.trim()}`);
  return parts.join(". ");
}