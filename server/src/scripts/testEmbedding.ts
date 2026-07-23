/**
 * Phase 1 proof-of-concept: the embedding pipeline.
 *
 * Run with:  npm run test:embedding
 *
 * This demonstrates the entire AI matching loop end to end:
 *   1. Turn a student profile into a vector
 *   2. Turn several topics into vectors
 *   3. Rank the topics by similarity to the student
 *
 * It needs a valid OPENAI_API_KEY in your .env to run.
 */
import { embed, cosineSimilarity, buildProfileText } from "../services/llm.service.js";

async function main() {
  console.log("── TFMio embedding pipeline test ──\n");

  // 1. A fake student profile
  const profileText = buildProfileText({
    degree: "Máster en Ingeniería Informática",
    skills: ["Machine Learning", "NLP", "Data Science", "Web Development"],
    interests: "Recommender systems, LLMs, educational technology",
    workStyle: "Applied / engineering-focused",
  });
  console.log("Student profile:\n ", profileText, "\n");

  const studentVector = await embed(profileText);
  console.log(`Profile embedded → vector of ${studentVector.length} numbers\n`);

  // 2. A few fake topics
  const topics = [
    "Intelligent recommender system for academic projects using large language models",
    "Federated learning for privacy-preserving medical imaging",
    "Real-time object detection for autonomous drones using computer vision",
    "Knowledge graph construction for scientific literature with NLP",
  ];

  // 3. Embed each topic and score it
  const scored: { topic: string; score: number }[] = [];
  for (const topic of topics) {
    const topicVector = await embed(topic);
    const score = cosineSimilarity(studentVector, topicVector);
    scored.push({ topic, score });
  }

  scored.sort((a, b) => b.score - a.score);

  console.log("Ranked recommendations:\n");
  for (const { topic, score } of scored) {
    const pct = Math.round(score * 100);
    console.log(`  ${pct}%  ${topic}`);
  }
  console.log("\n✓ Pipeline works: text → vectors → similarity → ranking");
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
