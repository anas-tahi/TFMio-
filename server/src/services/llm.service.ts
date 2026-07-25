import OpenAI from "openai";
import { env } from "../config/env.js";


const openai = new OpenAI({
  apiKey: env.openaiApiKey,
  baseURL: env.openaiBaseUrl, // if set (e.g. for Ollama), requests go there instead of OpenAI
});


export async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: env.embeddingModel,
    input: text,
  });
  return response.data[0].embedding;
}


export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must be the same length");
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function buildProfileText(profile: {
  skills?: string[];
  interests?: string;
  workStyle?: string;
  degree?: string;
}): string {
  const parts: string[] = [];
  if (profile.degree) parts.push(`Degree: ${profile.degree}`);
  if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(", ")}`);
  if (profile.interests) parts.push(`Research interests: ${profile.interests}`);
  if (profile.workStyle) parts.push(`Preferred work style: ${profile.workStyle}`);
  return parts.join(". ");
}

export async function generateProfileSummary(profileText: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: env.chatModel,
    messages: [
      {
        role: "system",
        content:
          "You summarize a student's academic profile in 2 concise sentences for a university TFM/TFG matching platform. Be factual and specific.",
      },
      { role: "user", content: profileText },
    ],
    max_tokens: 120,
  });
  return response.choices[0].message.content?.trim() ?? "";
}

export async function generateMatchSummary(
  profileText: string,
  topicTitle: string,
  topicDescription: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: env.chatModel,
    messages: [
      {
        role: "system",
        content:
          "You explain in exactly 2 sentences why a student is a good fit for a TFM/TFG topic, for the tutor reviewing the request. Focus on skill and interest alignment.",
      },
      {
        role: "user",
        content: `Student profile: ${profileText}\n\nTopic: ${topicTitle}\nDescription: ${topicDescription}`,
      },
    ],
    max_tokens: 120,
  });
  return response.choices[0].message.content?.trim() ?? "";
}

export async function analyzeDocument(
  documentText: string,
  requiredSections: string[]
): Promise<{ summary: string; missingSections: string[] }> {
  const response = await openai.chat.completions.create({
    model: env.chatModel,
    messages: [
      {
        role: "system",
        content:
          "You analyze an academic TFM/TFG document. Return a JSON object with two keys: 'summary' (3 sentences) and 'missingSections' (an array of any of the required sections not present). Return only valid JSON.",
      },
      {
        role: "user",
        content: `Required sections: ${requiredSections.join(", ")}\n\nDocument:\n${documentText.slice(0, 8000)}`,
      },
    ],
    max_tokens: 400,
    response_format: { type: "json_object" },
  });
  try {
    const parsed = JSON.parse(response.choices[0].message.content ?? "{}");
    return {
      summary: parsed.summary ?? "",
      missingSections: Array.isArray(parsed.missingSections) ? parsed.missingSections : [],
    };
  } catch {
    return { summary: "", missingSections: [] };
  }
}
