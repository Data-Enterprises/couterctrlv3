import { describe, expect, it } from "vitest";
import { subDeptKey } from "./subDeptKey";

/** ACE store 100223 files eight departments under number 0; each has to stay
 *  its own row. */
describe("subDeptKey", () => {
  const row = (n: number | null, d: string | null) => ({
    sub_department: n,
    sub_department_description: d,
  });

  it("joins the number and the description", () => {
    expect(subDeptKey(row(0, "DONATION"))).toBe("0|DONATION");
  });

  it("keeps two departments that share a number apart", () => {
    expect(subDeptKey(row(0, "DONATION"))).not.toBe(
      subDeptKey(row(0, "HHC Coupons and Certificates")),
    );
  });

  it("files a missing number under 0", () => {
    expect(subDeptKey(row(null, "DONATION"))).toBe("0|DONATION");
  });

  it("keeps the description exactly as sent", () => {
    expect(subDeptKey(row(5, "Fresh Meat"))).not.toBe(
      subDeptKey(row(5, "FRESH MEAT")),
    );
  });
});
