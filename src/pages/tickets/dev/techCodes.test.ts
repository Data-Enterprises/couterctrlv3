import { describe, it, expect } from "vitest";
import { nextTechCode, formatTechCode } from "./techCodes";
import type { TicketTech } from "../../../api/tickets";

const tech = (tech_code: string | null, is_active = true): TicketTech =>
  ({
    tech_id: 1,
    userid: 1,
    tech_code,
    display_name: null,
    is_active,
    created_at: "2026-10-19",
    username: "someone",
    user_level: 7,
  }) as TicketTech;

describe("nextTechCode", () => {
  it("is one past the highest code on the desk", () => {
    expect(nextTechCode([tech("1"), tech("2"), tech("7")])).toBe("TECH-008");
  });

  it("counts stood-down techs, who keep their codes", () => {
    // Skipping them is how two rows end up on 8.
    expect(nextTechCode([tech("7"), tech("9", false)])).toBe("TECH-010");
  });

  it("reads the digits out of a code already in the new shape", () => {
    expect(nextTechCode([tech("TECH-001"), tech("TECH-014")])).toBe("TECH-015");
  });

  it("carries on from a desk numbered by hand", () => {
    // The three live rows were typed, and read 1, 2 and 7.
    expect(nextTechCode([tech("1"), tech("TECH-002"), tech("007")])).toBe("TECH-008");
  });

  it("pads to three and grows past them", () => {
    expect(nextTechCode([tech("8")])).toBe("TECH-009");
    expect(nextTechCode([tech("99")])).toBe("TECH-100");
    expect(nextTechCode([tech("999")])).toBe("TECH-1000");
  });

  it("starts at one on an empty desk", () => {
    // Matches the server's `(highest or 0) + 1`.
    expect(nextTechCode([])).toBe("TECH-001");
    expect(nextTechCode([tech(null), tech(null)])).toBe("TECH-001");
  });

  it("takes the digits from a code that also has letters", () => {
    expect(nextTechCode([tech("T4"), tech("3")])).toBe("TECH-005");
  });

  it("ignores a code with no digits in it at all", () => {
    expect(nextTechCode([tech("AM"), tech("JS")])).toBe("TECH-001");
    expect(nextTechCode([tech("AM"), tech("6")])).toBe("TECH-007");
  });

  it("reads a code with space around it", () => {
    expect(nextTechCode([tech(" 4 ")])).toBe("TECH-005");
  });
});

describe("formatTechCode", () => {
  it("pads to three digits", () => {
    expect(formatTechCode(3)).toBe("TECH-003");
    expect(formatTechCode(6)).toBe("TECH-006");
    expect(formatTechCode(11)).toBe("TECH-011");
  });
});
