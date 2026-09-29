import fs from "fs";
import path from "path";

function randomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

const firstNames = [
  "Ana", "Carlos", "Lucía", "David", "Marta", "Javier", "Elena", "Pablo",
  "Sara", "Diego", "Laura", "Alejandro", "Paula", "Miguel", "Claudia",
  "Adrián", "Irene", "Sergio", "Beatriz", "Hugo",
];
const lastNames = [
  "García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández",
  "Ruiz", "Díaz", "Moreno", "Álvarez", "Romero", "Navarro", "Torres",
  "Domínguez", "Vázquez", "Ramos", "Gil", "Serrano", "Molina",
];

function randomName(): { first: string; last: string } {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { first, last };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]/g, "");
}

interface Row {
  fullName: string;
  email: string;
  role: "student" | "tutor" | "coordinator";
  activationCode: string;
  degreeShortName: string; // MII, GII, MCDIC
}

const degrees = ["MII", "GII", "MCDIC"];
const rows: Row[] = [];

// 50 students, spread across the 3 degrees
for (let i = 0; i < 50; i++) {
  const { first, last } = randomName();
  const degree = degrees[i % degrees.length];
  const email = `${slugify(first)}.${slugify(last)}${i}@correo.ugr.es`;
  rows.push({
    fullName: `${first} ${last}`,
    email,
    role: "student",
    activationCode: randomCode(),
    degreeShortName: degree,
  });
}

// 6 tutors, 2 per degree
for (let i = 0; i < 6; i++) {
  const { first, last } = randomName();
  const degree = degrees[i % degrees.length];
  const email = `${slugify(first)}.${slugify(last)}${i}@ugr.es`;
  rows.push({
    fullName: `Prof. ${first} ${last}`,
    email,
    role: "tutor",
    activationCode: randomCode(),
    degreeShortName: degree,
  });
}

// 3 coordinators, one per degree
for (let i = 0; i < 3; i++) {
  const { first, last } = randomName();
  const degree = degrees[i];
  const email = `${slugify(first)}.${slugify(last)}${i}@ugr.es`;
  rows.push({
    fullName: `Prof. ${first} ${last}`,
    email,
    role: "coordinator",
    activationCode: randomCode(),
    degreeShortName: degree,
  });
}

const header = "fullName,email,role,activationCode,degreeShortName";
const lines = rows.map(
  (r) => `${r.fullName},${r.email},${r.role},${r.activationCode},${r.degreeShortName}`
);
const csv = [header, ...lines].join("\n");

const outputPath = path.resolve("activation_accounts.csv");
fs.writeFileSync(outputPath, csv, "utf-8");

console.log(`✓ Generated ${rows.length} accounts → ${outputPath}`);