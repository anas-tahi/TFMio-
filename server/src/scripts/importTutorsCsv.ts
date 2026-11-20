import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Degree } from "../models/Degree.js";
import { UserRole } from "../types/index.js";
import { embed } from "../services/llm.service.js";
import { buildTutorProfileText } from "../utils/profileText.js";

/**
 * Creates tutor accounts from server/sample_tutors.csv (built by
 * generateTutorsCsv.ts). Each tutor gets their area/bio profile embedded right
 * away, so they are immediately usable for AI ranking without logging in.
 * Safe to run more than once: a tutor whose email already exists is skipped.
 *
 * Run from the server folder: npx tsx src/scripts/importTutorsCsv.ts
 */

interface TutorRow {
  fullName: string;
  email: string;
  department: string;
  areas: string;
  bio: string;
}

async function main() {
  await connectDB();

  const degree = await Degree.findOne({ shortName: "MII" });
  if (!degree) {
    console.error('No degree with shortName "MII" was found. Nothing was imported.');
    process.exit(1);
  }

  const csv = readFileSync("sample_tutors.csv", "utf-8");
  const rows: TutorRow[] = parse(csv, { columns: true, skip_empty_lines: true });

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await User.findOne({ email: row.email });
    if (existing) {
      console.log(`Skipped (already exists): ${row.email}`);
      skipped++;
      continue;
    }

    const areas = row.areas.split(";").map((a) => a.trim()).filter(Boolean);

    let embedding: number[] | undefined;
    try {
      embedding = await embed(
        buildTutorProfileText({ department: row.department, areas, bio: row.bio })
      );
    } catch (err) {
      console.warn(`Could not embed ${row.email}, saving without an AI number:`, err);
    }

    await User.create({
      email: row.email,
      fullName: row.fullName,
      role: UserRole.TUTOR,
      isActivated: false,
      department: row.department,
      areas,
      bio: row.bio,
      degrees: [degree._id],
      embedding,
    });

    console.log(`Created: ${row.fullName} (${row.department})`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});