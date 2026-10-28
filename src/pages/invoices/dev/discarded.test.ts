import { describe, expect, it } from "vitest";
import { discardedIn, type InvoiceFileReport } from "../../../api/invoices";
import reducer, {
  setInvoicesSent,
} from "../../../features/dev/devInvoicesSlice";
import { discardedText } from "./present";

const file = (over: Partial<InvoiceFileReport> = {}): InvoiceFileReport => ({
  file: "20260425ELVC5897",
  invoices: 4,
  pages: null,
  error: null,
  sourceKey: null,
  storageError: null,
  ...over,
});

describe("invoices the server would not save", () => {
  it("are gathered from every file, and a file without the field adds none", () => {
    const found = discardedIn([
      file({ discarded: [{ invoiceNumber: "100231", error: "lines.0.ext: required" }] }),
      file(),
      file({ discarded: [{ invoiceNumber: null, error: "totals: missing" }] }),
    ]);
    expect(found.map((d) => d.invoiceNumber)).toEqual(["100231", null]);
  });

  it("read as one line, by number, with the server's reason", () => {
    expect(
      discardedText([
        { invoiceNumber: "100231", error: "lines.0.ext: required" },
        { invoiceNumber: null, error: "totals: missing" },
      ]),
    ).toBe(
      "invoice 100231 (lines.0.ext: required); an invoice with no number (totals: missing)",
    );
  });

  it("are kept with the send, so the page cannot call it a clean one", () => {
    const state = reducer(
      undefined,
      setInvoicesSent({
        runId: "r1",
        warnings: [],
        discarded: [{ invoiceNumber: "100231", error: "x" }],
      }),
    );
    expect(state.sentAt).not.toBeNull();
    expect(state.serverDiscarded).toHaveLength(1);
  });

  it("are none when the server says nothing about them", () => {
    const state = reducer(undefined, setInvoicesSent({ runId: "r1", warnings: [] }));
    expect(state.serverDiscarded).toEqual([]);
  });
});
