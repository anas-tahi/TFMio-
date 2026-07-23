/**
 * Seed script — fills the database with realistic FAKE data for development.
 *
 * Nothing here is a real ETSIIT student or professor. This lets us build and
 * test the swipe/matching/AI recommendation flow without touching real people's
 * data. When the platform is ready for the pilot phase, this data gets wiped
 * and replaced with real (consenting) users.
 *
 * Run with:  npm run seed
 * (add "seed": "tsx src/scripts/seed.ts" to package.json scripts)
 */
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { Degree } from "../models/Degree.js";
import { User } from "../models/User.js";
import { Topic } from "../models/Topic.js";
import { UserRole, WorkType, TopicStatus } from "../types/index.js";
import mongoose from "mongoose";

const FAKE_PASSWORD = "Password123"; // same for every seeded account, for easy testing

async function clearExisting() {
  await Promise.all([
    Degree.deleteMany({}),
    User.deleteMany({}),
    Topic.deleteMany({}),
  ]);
  console.log("✓ Cleared existing Degree / User / Topic collections");
}

async function seedDegrees() {
  const degrees = await Degree.insertMany([
    { name: "Máster en Ingeniería Informática", shortName: "MII", school: "ETSIIT", level: WorkType.TFM },
    { name: "Grado en Ingeniería Informática", shortName: "GII", school: "ETSIIT", level: WorkType.TFG },
    { name: "Máster en Ciencia de Datos e Ingeniería de Computadores", shortName: "MCDIC", school: "ETSIIT", level: WorkType.TFM },
  ]);
  console.log(`✓ Seeded ${degrees.length} degrees (titulaciones)`);
  return degrees;
}

async function seedUsers(degrees: Awaited<ReturnType<typeof seedDegrees>>) {
  const [mii, gii, mcdic] = degrees;
  const hashed = await bcrypt.hash(FAKE_PASSWORD, 10);

  // ── Coordinators — one per degree, as Miguel requested ──
  const coordinators = await User.insertMany([
    {
      email: "coord.mii@fake.tfmio.es",
      password: hashed,
      fullName: "Isabel Fernández (Coord. MII)",
      role: UserRole.COORDINATOR,
      degreeManaged: mii._id,
    },
    {
      email: "coord.gii@fake.tfmio.es",
      password: hashed,
      fullName: "Rafael Ortega (Coord. GII)",
      role: UserRole.COORDINATOR,
      degreeManaged: gii._id,
    },
  ]);

  // Link the degree documents back to their coordinator
  await Degree.findByIdAndUpdate(mii._id, { coordinator: coordinators[0]._id });
  await Degree.findByIdAndUpdate(gii._id, { coordinator: coordinators[1]._id });

  // ── Tutors ──
  const tutors = await User.insertMany([
    {
      email: "miguel.garcia@fake.tfmio.es",
      password: hashed,
      fullName: "Prof. Miguel García Silvente",
      role: UserRole.TUTOR,
      department: "DECSAI",
      bio: "Investigador en inteligencia artificial aplicada y sistemas de recomendación.",
      degrees: [mii._id, mcdic._id],
    },
    {
      email: "ana.lopez@fake.tfmio.es",
      password: hashed,
      fullName: "Prof. Ana López",
      role: UserRole.TUTOR,
      department: "LSI",
      bio: "Especialista en aprendizaje federado y privacidad de datos.",
      degrees: [mii._id],
    },
    {
      email: "ramon.castro@fake.tfmio.es",
      password: hashed,
      fullName: "Prof. Ramón Castro",
      role: UserRole.TUTOR,
      department: "DECSAI",
      bio: "Líneas de investigación en IA explicable y aplicaciones clínicas.",
      degrees: [gii._id],
    },
  ]);

  // ── Students — varied skill profiles so recommendations are meaningfully different ──
  const students = await User.insertMany([
    {
      email: "anas.tahir@fake.tfmio.es",
      password: hashed,
      fullName: "Anas Tahir",
      role: UserRole.STUDENT,
      degree: mii._id,
      year: 1,
      skills: ["Machine Learning", "NLP", "Data Science", "Web Development"],
      interests: "Recommender systems, LLMs, educational technology",
      workStyle: "Applied / engineering-focused",
    },
    {
      email: "laura.romero@fake.tfmio.es",
      password: hashed,
      fullName: "Laura Romero",
      role: UserRole.STUDENT,
      degree: gii._id,
      year: 4,
      skills: ["Computer Vision", "Robotics", "C++"],
      interests: "Autonomous systems, real-time perception",
      workStyle: "Research-focused",
    },
    {
      email: "carlos.medina@fake.tfmio.es",
      password: hashed,
      fullName: "Carlos Medina",
      role: UserRole.STUDENT,
      degree: mii._id,
      year: 1,
      skills: ["Explainable AI", "Healthcare Data", "Python"],
      interests: "Clinical decision support, model interpretability",
      workStyle: "Research-focused",
    },
  ]);

  console.log(`✓ Seeded ${coordinators.length} coordinators, ${tutors.length} tutors, ${students.length} students`);
  console.log(`  (all use password: ${FAKE_PASSWORD})`);
  return { tutors, mii, gii, mcdic };
}

async function seedTopics(tutors: mongoose.Document[], mii: mongoose.Document, gii: mongoose.Document) {
  const [miguel, ana, ramon] = tutors as unknown as { _id: mongoose.Types.ObjectId }[];

  const topics = await Topic.insertMany([
    {
      title: "Intelligent recommender system for academic projects using LLMs",
      description:
        "Design and implement a recommendation engine that matches students with TFM/TFG topics using large language models for profile analysis and semantic similarity.",
      tutor: miguel._id,
      department: "DECSAI",
      degrees: [mii._id],
      type: WorkType.TFM,
      skills: ["NLP", "Machine Learning", "Python", "Recommender Systems"],
      totalSpots: 2,
      status: TopicStatus.ACTIVE,
    },
    {
      title: "Federated learning for privacy-preserving medical imaging",
      description:
        "Explore federated learning architectures that allow multiple hospitals to collaboratively train diagnostic models without sharing raw patient data.",
      tutor: ana._id,
      department: "LSI",
      degrees: [mii._id],
      type: WorkType.TFM,
      skills: ["Machine Learning", "Data Science", "Privacy"],
      totalSpots: 1,
      status: TopicStatus.ACTIVE,
    },
    {
      title: "Explainable AI for clinical decision support systems",
      description:
        "Develop interpretable machine learning models that help clinicians understand and trust automated diagnostic recommendations.",
      tutor: ramon._id,
      department: "DECSAI",
      degrees: [gii._id],
      type: WorkType.TFG,
      skills: ["Explainable AI", "Healthcare Data", "Python"],
      totalSpots: 1,
      status: TopicStatus.ACTIVE,
    },
    {
      title: "Real-time object detection for autonomous drones",
      description:
        "Build and optimize a real-time computer vision pipeline for obstacle detection and avoidance on low-power drone hardware.",
      tutor: ana._id,
      department: "LSI",
      degrees: [gii._id],
      type: WorkType.TFG,
      skills: ["Computer Vision", "Robotics", "C++"],
      totalSpots: 1,
      status: TopicStatus.ACTIVE,
    },
  ]);

  console.log(`✓ Seeded ${topics.length} topics`);
}

async function main() {
  await connectDB();
  await clearExisting();
  const degrees = await seedDegrees();
  const { tutors, mii, gii } = await seedUsers(degrees);
  await seedTopics(tutors, mii, gii);
  console.log("\n✓ Seed complete. Log in with any seeded email + password: " + FAKE_PASSWORD);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
