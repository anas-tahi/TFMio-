import { describe, it, expect } from "vitest";
import { buildTopicText } from "./topicText.js";

describe("buildTopicText", () => {
  it("joins title and description with '. '", () => {
    expect(buildTopicText({ title: "Recomendador", description: "Motor de recomendación" })).toBe(
      "Recomendador. Motor de recomendación"
    );
  });

  it("appends the skills when there are some", () => {
    expect(
      buildTopicText({ title: "T", description: "D", skills: ["NLP", "Databases"] })
    ).toBe("T. D. Skills: NLP, Databases");
  });

  it("omits the skills line when the list is empty or missing", () => {
    expect(buildTopicText({ title: "T", description: "D", skills: [] })).toBe("T. D");
    expect(buildTopicText({ title: "T", description: "D" })).toBe("T. D");
  });

  it("trims whitespace around the title and the description", () => {
    expect(buildTopicText({ title: "  Hola ", description: " Mundo  " })).toBe("Hola. Mundo");
  });
});