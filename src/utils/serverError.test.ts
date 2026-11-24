import { describe, expect, it } from "vitest";
import { reasonOf, serverDetail, serverStatus } from "./serverError";

/** The shape axios rejects with: the response hangs off `response`. */
const rejected = (status: number, data: unknown) => ({
  message: `Request failed with status code ${status}`,
  status,
  response: { status, data },
});

describe("serverError", () => {
  it("reads FastAPI's detail from the response, not the error", () => {
    const err = rejected(403, { detail: "You are not assigned to store(s): 296" });
    expect(serverStatus(err)).toBe(403);
    expect(serverDetail(err)).toBe("You are not assigned to store(s): 296");
    expect(reasonOf(err)).toBe("You are not assigned to store(s): 296");
  });

  it("joins a 422's validation messages", () => {
    const err = rejected(422, {
      detail: [
        { loc: ["body", "vendorIds", 0], msg: "Input should be a valid string" },
        { loc: ["body", "cashierNumbers", 1], msg: "Input should be a valid integer" },
      ],
    });
    expect(serverDetail(err)).toBe(
      "Input should be a valid string; Input should be a valid integer",
    );
  });

  it("takes the house `msg` when there is no detail", () => {
    expect(serverDetail(rejected(500, { error: 1, msg: "S3 refused the write" }))).toBe(
      "S3 refused the write",
    );
  });

  it("falls back to axios's message when the server said nothing", () => {
    const err = { message: "Network Error" };
    expect(serverStatus(err)).toBeUndefined();
    expect(serverDetail(err)).toBeUndefined();
    expect(reasonOf(err)).toBe("Network Error");
  });

  it("survives something that is not an error at all", () => {
    expect(serverStatus(null)).toBeUndefined();
    expect(reasonOf(undefined)).toBe("no response");
  });
});
