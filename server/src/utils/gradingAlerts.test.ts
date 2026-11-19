import { describe, it, expect } from "vitest";
import { decideGradingAlert, joinNames } from "./gradingAlerts.js";

const base = { missingCount: 1, reminderSent: false, overdueSent: false };

describe("decideGradingAlert", () => {
  it("does nothing when nobody is missing, in any phase", () => {
    for (const phase of ["none", "waiting", "reminder", "overdue"] as const) {
      expect(decideGradingAlert({ ...base, phase, missingCount: 0 })).toBeNull();
    }
  });

  it("does nothing while the deadline is still far away", () => {
    expect(decideGradingAlert({ ...base, phase: "waiting" })).toBeNull();
  });

  it("does nothing when there is no deadline", () => {
    expect(decideGradingAlert({ ...base, phase: "none" })).toBeNull();
  });

  it("sends the reminder in the reminder phase", () => {
    expect(decideGradingAlert({ ...base, phase: "reminder" })).toBe("reminder");
  });

  it("does not send the reminder twice", () => {
    expect(decideGradingAlert({ ...base, phase: "reminder", reminderSent: true })).toBeNull();
  });

  it("tells the coordinator once the deadline has passed", () => {
    expect(decideGradingAlert({ ...base, phase: "overdue" })).toBe("overdue");
  });

  it("does not tell the coordinator twice", () => {
    expect(decideGradingAlert({ ...base, phase: "overdue", overdueSent: true })).toBeNull();
  });

  it("tells the coordinator even if the reminder was never sent", () => {
    expect(
      decideGradingAlert({ ...base, phase: "overdue", reminderSent: false, overdueSent: false })
    ).toBe("overdue");
  });

  it("does not send a reminder after the deadline", () => {
    expect(
      decideGradingAlert({ ...base, phase: "overdue", reminderSent: false, overdueSent: true })
    ).toBeNull();
  });
});

describe("joinNames", () => {
  it("returns an empty text for an empty list", () => {
    expect(joinNames([])).toBe("");
  });

  it("returns a single name as it is", () => {
    expect(joinNames(["Ana"])).toBe("Ana");
  });

  it("joins two names with 'y'", () => {
    expect(joinNames(["Ana", "Luis"])).toBe("Ana y Luis");
  });

  it("joins three names with commas and a final 'y'", () => {
    expect(joinNames(["Ana", "Luis", "Marta"])).toBe("Ana, Luis y Marta");
  });
});