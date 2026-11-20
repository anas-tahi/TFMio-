import { writeFileSync } from "fs";

/**
 * Writes a CSV of sample tutors, built from real ETSIIT professor names
 * (DECSAI and LSI, taken from the departments' own public pages) with test
 * data for everything else: emails, areas and bios. Used to seed a wider,
 * more realistic set of tutors for testing the jury suggestion.
 *
 * Run from the server folder: npx tsx src/scripts/generateTutorsCsv.ts
 */

interface TutorRow {
  fullName: string;
  email: string;
  department: "DECSAI" | "LSI";
  areas: string; // semicolon-separated, matches the app's area tags
  bio: string;
}

const rows: TutorRow[] = [
  {
    fullName: "Prof. Francisco Herrera Triguero",
    email: "francisco.herrera@fake.tfmio.es",
    department: "DECSAI",
    areas: "Machine Learning;Data Science",
    bio: "Investiga en minería de datos y sistemas de aprendizaje con grandes volúmenes de información.",
  },
  {
    fullName: "Prof. María José Martín Bautista",
    email: "mariajose.martin@fake.tfmio.es",
    department: "DECSAI",
    areas: "Data Science;NLP",
    bio: "Trabaja en extracción de conocimiento y recuperación de información a partir de texto.",
  },
  {
    fullName: "Prof. Juan Manuel Fernández Luna",
    email: "juanmanuel.fernandez@fake.tfmio.es",
    department: "DECSAI",
    areas: "NLP;Data Science",
    bio: "Especialista en sistemas de recuperación de información y búsqueda.",
  },
  {
    fullName: "Prof. Francisco José Cortijo Bon",
    email: "francisco.cortijo@fake.tfmio.es",
    department: "DECSAI",
    areas: "Computer Vision;Machine Learning",
    bio: "Trabaja en reconocimiento de patrones y visión por computador.",
  },
  {
    fullName: "Prof. David Alejandro Pelta Mochcovsky",
    email: "david.pelta@fake.tfmio.es",
    department: "DECSAI",
    areas: "Machine Learning;Robotics",
    bio: "Investiga en optimización y toma de decisiones con incertidumbre.",
  },
  {
    fullName: "Prof. Carlos Alberto Cruz Corona",
    email: "carlos.cruz@fake.tfmio.es",
    department: "DECSAI",
    areas: "Data Science;Cloud Computing",
    bio: "Trabaja en modelos de decisión y optimización aplicada.",
  },
  {
    fullName: "Prof. Juan Carlos Torres Cantero",
    email: "juancarlos.torres@fake.tfmio.es",
    department: "LSI",
    areas: "Web Development;Robotics",
    bio: "Investiga en informática gráfica y simulación interactiva.",
  },
  {
    fullName: "Prof. María Luisa Rodríguez Almendros",
    email: "marialuisa.rodriguez@fake.tfmio.es",
    department: "LSI",
    areas: "Databases;Web Development",
    bio: "Trabaja en integración de información y diseño de software.",
  },
  {
    fullName: "Prof. Ramón López-Cózar Delgado",
    email: "ramon.lopezcozar@fake.tfmio.es",
    department: "LSI",
    areas: "NLP;Security",
    bio: "Especialista en sistemas de diálogo basados en procesamiento del habla.",
  },
  {
    fullName: "Prof. Patricia Paderewski Rodríguez",
    email: "patricia.paderewski@fake.tfmio.es",
    department: "LSI",
    areas: "Web Development;Distributed Systems",
    bio: "Investiga en especificación, diseño y evolución de sistemas software.",
  },
  {
    fullName: "Prof. Sergio Alonso Burgos",
    email: "sergio.alonso@fake.tfmio.es",
    department: "LSI",
    areas: "Distributed Systems;Databases",
    bio: "Trabaja en sistemas distribuidos y bases de datos aplicadas.",
  },
];

const header = "fullName,email,department,areas,bio";
const lines = rows.map(
  (r) => `"${r.fullName}","${r.email}","${r.department}","${r.areas}","${r.bio}"`
);

const outPath = "sample_tutors.csv";
writeFileSync(outPath, [header, ...lines].join("\n"), "utf-8");
console.log(`Wrote ${rows.length} tutors to ${outPath}`);