import { embed, cosineSimilarity } from "../services/llm.service.js";

/**
 * Measures how similar pairs of topic texts look to the embedding model, so the
 * "similar topic" warning can use a threshold based on real numbers instead of
 * a guess. Needs Ollama running. Does not touch the database.
 *
 * Run from the server folder:  npx tsx src/scripts/calibrateSimilarity.ts
 */

type Group = "duplicate" | "same area, different project" | "unrelated";

interface Pair {
  group: Group;
  label: string;
  a: string;
  b: string;
}

const pairs: Pair[] = [
  // Same idea, different wording
  {
    group: "duplicate",
    label: "topic recommender",
    a: "Sistema de recomendación con IA. Motor de recomendación que usa modelos de lenguaje para sugerir temas de TFM.",
    b: "Recomendador inteligente de temas de TFM. Un motor que propone temas de trabajo fin de máster usando modelos de lenguaje.",
  },
  {
    group: "duplicate",
    label: "student chatbot",
    a: "Chatbot de atención al estudiante con modelos de lenguaje. Desarrollar un asistente conversacional que responda dudas sobre trámites y plazos.",
    b: "Asistente virtual para dudas académicas. Crear un agente conversacional con LLM que conteste preguntas de los alumnos sobre plazos y gestiones.",
  },
  {
    group: "duplicate",
    label: "federated intrusion detection",
    a: "Detección de intrusiones con aprendizaje federado. Diseñar un sistema que detecte intrusiones en redes distribuidas entrenando modelos de forma federada.",
    b: "IDS federado para redes distribuidas. Sistema de detección de ataques en red donde cada nodo entrena un modelo local sin compartir sus datos.",
  },

  // Same area, clearly different project
  {
    group: "same area, different project",
    label: "chatbot vs sentiment analysis",
    a: "Chatbot de atención al estudiante con modelos de lenguaje. Desarrollar un asistente conversacional que responda dudas sobre trámites y plazos.",
    b: "Análisis de sentimiento en reseñas de productos. Clasificar opiniones de clientes en español usando modelos de lenguaje preentrenados.",
  },
  {
    group: "same area, different project",
    label: "topic vs movie recommender",
    a: "Sistema de recomendación con IA. Motor de recomendación que usa modelos de lenguaje para sugerir temas de TFM.",
    b: "Recomendador de películas. Sugerir películas a los usuarios mediante filtrado colaborativo.",
  },
  {
    group: "same area, different project",
    label: "federated IDS vs medical",
    a: "Detección de intrusiones con aprendizaje federado. Diseñar un sistema que detecte intrusiones en redes distribuidas entrenando modelos de forma federada.",
    b: "Aprendizaje federado para diagnóstico médico. Entrenar modelos de diagnóstico sobre imágenes sin compartir datos de pacientes.",
  },

  // Nothing in common
  {
    group: "unrelated",
    label: "chatbot vs delivery routes",
    a: "Chatbot de atención al estudiante con modelos de lenguaje. Desarrollar un asistente conversacional que responda dudas sobre trámites y plazos.",
    b: "Optimización de rutas de reparto con algoritmos genéticos. Minimizar el coste logístico de una flota de camiones.",
  },
  {
    group: "unrelated",
    label: "federated IDS vs gym app",
    a: "Detección de intrusiones con aprendizaje federado. Diseñar un sistema que detecte intrusiones en redes distribuidas entrenando modelos de forma federada.",
    b: "Aplicación web de gestión de un gimnasio. Desarrollar una plataforma para reservar clases y gestionar socios.",
  },
  {
    group: "unrelated",
    label: "recommender vs fluid simulation",
    a: "Sistema de recomendación con IA. Motor de recomendación que usa modelos de lenguaje para sugerir temas de TFM.",
    b: "Simulación de fluidos en tiempo real con GPU. Implementar un simulador de dinámica de fluidos acelerado por tarjeta gráfica.",
  },
];

function summary(name: string, values: number[]) {
  console.log(
    `${name.padEnd(30)} min ${Math.min(...values).toFixed(1)}%   max ${Math.max(...values).toFixed(1)}%`
  );
}

async function main() {
  const results: { group: Group; label: string; percent: number }[] = [];

  for (const pair of pairs) {
    const [ea, eb] = await Promise.all([embed(pair.a), embed(pair.b)]);
    results.push({
      group: pair.group,
      label: pair.label,
      percent: cosineSimilarity(ea, eb) * 100,
    });
  }

  console.log("\nSimilarity between pairs of topic texts (cosine, in %)\n");
  for (const r of results) {
    console.log(`${r.group.padEnd(30)} ${r.label.padEnd(34)} ${r.percent.toFixed(1)}%`);
  }

  const of = (group: Group) => results.filter((r) => r.group === group).map((r) => r.percent);
  const duplicates = of("duplicate");
  const related = of("same area, different project");
  const unrelated = of("unrelated");

  console.log("");
  summary("duplicate", duplicates);
  summary("same area, different project", related);
  summary("unrelated", unrelated);

  const highestNonDuplicate = Math.max(...related, ...unrelated);
  const lowestDuplicate = Math.min(...duplicates);

  if (lowestDuplicate > highestNonDuplicate) {
    const midpoint = (lowestDuplicate + highestNonDuplicate) / 2;
    console.log(
      `\nThe groups separate cleanly (gap: ${highestNonDuplicate.toFixed(1)}% to ${lowestDuplicate.toFixed(1)}%). Candidate threshold: ${midpoint.toFixed(1)}%`
    );
  } else {
    console.log(
      "\nThe groups overlap, so no clean threshold exists with this model and these texts."
    );
  }
}

main().catch((err) => {
  console.error("Could not run the calibration. Is Ollama running?", err);
  process.exit(1);
});