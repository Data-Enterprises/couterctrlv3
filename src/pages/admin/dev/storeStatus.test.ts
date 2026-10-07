import { describe, it, expect } from "vitest";
import { closedOn, statusOf, statusReported } from "./storeStatus";

describe("statusOf", () => {
  it("is unknown when the endpoint does not return the field", () => {
    expect(statusOf({})).toBe("unknown");
  });

  it("is open on a null, which is what the column holds for a live store", () => {
    expect(statusOf({ deactivated_at: null })).toBe("open");
  });

  it("is closed on a real timestamp", () => {
    expect(statusOf({ deactivated_at: "2026-10-07T20:59:13.796043" })).toBe(
      "closed",
    );
  });

  /**
   * The bug this function was written twice for.
   *
   * The unassigned half of the stores endpoint goes through `pd.merge`, which
   * types a column holding any real timestamp as datetime64 and turns its
   * nulls into NaT — and NaT leaves Python as a STRING. Testing `!== null`
   * put every one of those in the closed branch, so closing a single store
   * made the whole list read as closed.
   */
  it("is open on NaT, however non-null that string is", () => {
    expect(statusOf({ deactivated_at: "NaT" })).toBe("open");
  });

  it("is open on NaN and on an empty string", () => {
    expect(statusOf({ deactivated_at: "NaN" })).toBe("open");
    expect(statusOf({ deactivated_at: "" })).toBe("open");
  });

  it("is open on anything else that is not a date", () => {
    expect(statusOf({ deactivated_at: "not a date" })).toBe("open");
  });
});

describe("statusReported", () => {
  it("asks about the field, not the value — all-open still counts", () => {
    expect(statusReported([{ deactivated_at: null }, { deactivated_at: null }])).toBe(
      true,
    );
  });

  it("is false only while nothing carries it at all", () => {
    expect(statusReported([{}, {}])).toBe(false);
  });

  it("takes one store carrying it as enough", () => {
    expect(statusReported([{}, { deactivated_at: "2026-10-07T20:59:13" }])).toBe(
      true,
    );
  });

  it("is false for an empty list rather than claiming to know", () => {
    expect(statusReported([])).toBe(false);
  });
});

describe("closedOn", () => {
  it("gives the day and drops the time", () => {
    expect(closedOn("2026-10-07T20:59:13.796043")).toBe("Oct 7, 2026");
  });

  it("gives nothing rather than Invalid Date", () => {
    expect(closedOn("NaT")).toBe("");
    expect(closedOn("")).toBe("");
  });
});
