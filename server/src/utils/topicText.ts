/**
 * Builds the text we embed for a topic: title, description and, when present,
 * the skills. Shared by topic publishing and by the similar-topic check, so a
 * draft being typed is compared in the same shape as the stored topics.
 */
export function buildTopicText(topic: {
  title: string;
  description: string;
  skills?: string[];
}): string {
  const parts = [topic.title.trim(), topic.description.trim()];
  if (topic.skills?.length) parts.push(`Skills: ${topic.skills.join(", ")}`);
  return parts.join(". ");
}