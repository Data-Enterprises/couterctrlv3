import { describe, it, expect } from "vitest";
import { nextTechCode } from "./techCodes";
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
    expect(nextTechCode([tech("1"), tech("2"), tech("7")])).toBe("8");
  });

  it("counts stood-down techs, who keep their codes", () => {
    // Skipping them is how two rows end up on 8.
    expect(nextTechCode([tech("7"), tech("9", false)])).toBe("10");
  });

  it("keeps the padding the desk already uses", () => {
    expect(nextTechCode([tech("01"), tech("09")])).toBe("10");
    expect(nextTechCode([tech("001"), tech("014")])).toBe("015");
  });

  it("does not shrink a number past its own width", () => {
    expect(nextTechCode([tech("8"), tech("99")])).toBe("100");
  });

  it("ignores codes that are not numbers", () => {
    expect(nextTechCode([tech("T4"), tech("3")])).toBe("4");
  });

  it("has no answer for a desk that letters its codes", () => {
    expect(nextTechCode([tech("AM"), tech("JS")])).toBeNull();
  });

  it("has no answer for a desk with no codes at all", () => {
    expect(nextTechCode([tech(null), tech(null)])).toBeNull();
    expect(nextTechCode([])).toBeNull();
  });

  it("reads a code with space around it", () => {
    expect(nextTechCode([tech(" 4 ")])).toBe("5");
  });
});
