import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Degree } from "../models/Degree.js";
import { UserRole, WorkType } from "../types/index.js";
import mongoose from "mongoose";

interface CsvRow {
  fullName: string;
  email: string;
  role: "student" | "tutor" | "coordinator";
  activationCode: string;
  degreeShortName: string;
}

async function run() {
  await connectDB();

  const csvPath = path.resolve("activation_accounts.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows: CsvRow[] = parse(raw, { columns: true, skip_empty_lines: true });

  // Ensure the 3 degrees exist (reuse them if the seed script already made them).
  const degreeMap = new Map<string, mongoose.Types.ObjectId>();
  const degreeDefs = [
    { shortName: "MII", name: "Máster en Ingeniería Informática", level: WorkType.TFM },
    { shortName: "GII", name: "Grado en Ingeniería Informática", level: WorkType.TFG },
    { shortName: "MCDIC", name: "Máster en Ciencia de Datos e Ingeniería de Computadores", level: WorkType.TFM },
  ];
  for (const def of degreeDefs) {
    const existing = await Degree.findOneAndUpdate(
      { shortName: def.shortName },
      { $setOnInsert: { name: def.name, school: "ETSIIT", level: def.level } },
      { new: true, upsert: true }
    );
    degreeMap.set(def.shortName, existing._id);
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await User.findOne({ email: row.email.toLowerCase() });
    if (existing) {
      skipped++;
      continue;
    }

    const degreeId = degreeMap.get(row.degreeShortName);

    const doc: Record<string, unknown> = {
      email: row.email.toLowerCase(),
      fullName: row.fullName,
      role: row.role as UserRole,
      activationCode: row.activationCode,
      isActivated: false,
    };

    if (row.role === "student") {
      doc.degree = degreeId;
    } else if (row.role === "tutor") {
      doc.degrees = degreeId ? [degreeId] : [];
      doc.department = "DECSAI";
    } else if (row.role === "coordinator") {
      doc.degreeManaged = degreeId;
    }

    await User.create(doc);
    created++;
  }

  console.log(`✓ Import complete — created: ${created}, skipped (already existed): ${skipped}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});