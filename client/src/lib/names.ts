// Academic titles that appear at the start of seeded tutor/coordinator names
// ("Prof. Miguel García Silvente") and shouldn't be used as the first name.
const TITLES = /^(prof|profa|dr|dra|sr|sra)\.?$/i;

/** First real name, skipping any leading title: "Prof. Ana López" -> "Ana". */
export function displayFirstName(fullName?: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  const firstRealName = parts.find((p) => !TITLES.test(p));
  return firstRealName ?? parts[0];
}