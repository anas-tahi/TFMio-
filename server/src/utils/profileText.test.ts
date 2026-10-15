import { describe, it, expect } from "vitest";
import { buildTutorProfileText } from "./profileText.js";

describe("buildTutorProfileText", () => {
  it("includes department, areas and bio when all are provided", () => {
    const text = buildTutorProfileText({
      department: "DECSAI",
      areas: ["NLP", "Machine Learning"],
      bio: "Works on language models",
    });
    expect(text).toBe(
      "Department: DECSAI. Areas of expertise: NLP, Machine Learning. Bio: Works on language models"
    );
  });

  it("omits fields that are missing", () => {
    expect(buildTutorProfileText({ areas: ["Databases"] })).toBe("Areas of expertise: Databases");
  });

  it("returns an empty string when nothing is provided", () => {
    expect(buildTutorProfileText({})).toBe("");
  });

  it("ignores a bio that is only whitespace", () => {
    expect(buildTutorProfileText({ bio: "   ", department: "LSI" })).toBe("Department: LSI");
  });

  it("omits the areas line when the array is empty", () => {
    expect(buildTutorProfileText({ areas: [], bio: "Hi" })).toBe("Bio: Hi");
  });
});