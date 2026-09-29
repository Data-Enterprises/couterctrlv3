import axios from "axios";

/**
 * Invoice parsing on the server — `api/routers/invoices.py`.
 *
 * One route per engine, all returning the same shape: `parse_bedrock` and
 * `parse_textract` read scanned images, `parse_edi` decodes AWG's fixed-width
 * electronic invoices. EDI has no OCR and no per-page cost, which is why its
 * file cap is 100 MB against the OCR engines' 20.
 *
 * Money crosses as **strings**, already rounded to two places. Do not
 * `parseFloat` and re-round: the reconciliation below compares them as sent,
 * and a round trip through a float is the one way a figure that balanced on
 * the server arrives a cent out here.
 */

const authHeader = (token: string) => ({
  Authorization: "Bearer " + token,
});

/** Engines the invoice routes accept. `awg_edi` is this page's. */
export type InvoiceEngine = "awg_edi" | "bedrock" | "textract";

export interface InvoiceLine {
  description: string;
  itemCode: string;
  upc: string;
  /** Cases billed, not units. Whole numbers, typed float only because the
   *  shared schema is. */
  qty: number;
  unitPrice: string;
  /** Always null on EDI — allowances are totalled per invoice, in `discount`. */
  allowance: string | null;
  ext: string;
}

export interface InvoiceTotals {
  subtotal: string;
  discount: string;
  deposit: string | null;
  credits: string | null;
  /** Delivery charges. `sum(lines) + serviceFee === invoiceTotal` holds
   *  exactly on EDI. */
  serviceFee: string;
  invoiceTotal: string;
}

export interface ParsedInvoice {
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  account: string;
  /** Filled on EDI from the caller's own store list — the one field EDI knows
   *  better than OCR, which reads it off the document. */
  storeName: string;
  storeNumber: string;
  /** Always null on EDI: the format does not carry them. Render nothing rather
   *  than an empty row. */
  terms: string | null;
  pages: number | null;
  lines: InvoiceLine[];
  totals: InvoiceTotals;
}

export interface ReconcileCheckResp {
  label: string;
  derived: string;
  reported: string;
  ok: boolean;
}

export interface ReconcileResp {
  invoiceNumber: string;
  file: string;
  reconciled: boolean;
  /**
   * Four checks on EDI — or none.
   *
   * An invoice with no `19` total record has nothing to verify against and
   * comes back with an empty array and `reconciled: false`. Empty is not a
   * pass, and `checks.every(ok)` on an empty array says it is, so read
   * `reconciled` and treat empty as its own state.
   */
  checks: ReconcileCheckResp[];
}

export interface InvoiceFileReport {
  file: string;
  invoices: number;
  pages: number | null;
  error: string | null;
  sourceKey: string | null;
  storageError: string | null;
  /** awg_edi only, below. */
  records?: number;
  recordsByType?: Record<string, number>;
  warningCount?: number;
  /** Record types this build has no layout for — AWG's 20/21 credit memos
   *  among them. Money the decoder saw and did not understand, so a run with
   *  warnings must not look identical to a clean one. */
  warnings?: string[];
  /** Every store the file mentions. One transmission can carry several, and
   *  they are not always the `storeid` that was posted. */
  storeNumbers?: string[];
}

export interface InvoiceParseResp {
  error: number;
  success: boolean;
  msg: string;
  /** Keep it — this is how a result is fetched again without re-uploading. */
  runId: string;
  engine: InvoiceEngine;
  storeid: number;
  pageCount: number;
  estCostUsd: string;
  invoices: ParsedInvoice[];
  reconciliation: ReconcileResp[];
  files: InvoiceFileReport[];
  storage: {
    bucket?: string;
    prefix?: string;
    resultKey?: string;
    error?: string | null;
  };
  model: string;
}

/** House convention: an unexpected failure is an HTTP 200 carrying
 *  `error: 1`, so `res.ok` proves nothing on its own. */
export const invoiceFailed = (j: { error: number; success: boolean }) =>
  j.error !== 0 || j.success === false;

/** Five files a request, and 100 MB each — refused whole above the first,
 *  per-file above the second. */
export const MAX_INVOICE_FILES = 5;
export const MAX_INVOICE_FILE_BYTES = 100 * 1024 * 1024;

/**
 * Decode one or more AWG transmissions.
 *
 * `storeid` is checked against the caller's own store list before any work, so
 * a store they cannot use refuses the whole request rather than returning an
 * empty parse.
 *
 * Filenames are not filtered anywhere — AWG names these by transmission date
 * with no extension at all. A file that turns out not to be a QBP539 extract
 * fails in its own `files[].error` and leaves the rest of the request alone.
 */
export const parseEdiInvoices = (
  url: string,
  token: string,
  storeid: number,
  files: File[],
) => {
  const form = new FormData();
  for (const file of files) form.append("files", file, file.name);
  form.append("storeid", String(storeid));
  // Content-Type is deliberately unset: the browser has to add the multipart
  // boundary, and naming the type by hand drops it.
  return axios({
    method: "POST",
    headers: authHeader(token),
    url: url + "invoices/parse_edi",
    data: form,
  });
};

export interface InvoiceHistoryResp {
  error: number;
  success: boolean;
  msg?: string;
  runs: {
    runId: string;
    engine: InvoiceEngine;
    storeid: number;
    status: "success" | "partial" | "failed";
    created_at: string;
    invoices: number;
  }[];
}

/** Past runs, newest first. `engine` narrows to one decoder. */
export const getInvoiceHistory = (
  url: string,
  token: string,
  storeid: number,
  opts: { engine?: InvoiceEngine; status?: "success" | "partial" | "failed" } = {},
) =>
  axios({
    method: "GET",
    headers: authHeader(token),
    url: url + "invoices/history",
    params: { storeid, ...opts },
  });

/** One run's full result, by the `runId` its parse returned. */
export const getInvoiceResult = (url: string, token: string, runId: string) =>
  axios({
    method: "GET",
    headers: authHeader(token),
    url: url + `invoices/result/${runId}`,
  });
