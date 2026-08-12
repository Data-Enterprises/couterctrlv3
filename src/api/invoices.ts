import axios from "axios";
import type { InvoiceEngine, InvoiceRunStatus } from "../interfaces";

/** Two endpoints, one request shape. `/parse_scanned` still exists server-side
 *  as an alias for the Bedrock path, but new code names the engine. */
const ENGINE_PATHS: Record<InvoiceEngine, string> = {
  bedrock: "invoices/parse_bedrock",
  textract: "invoices/parse_textract",
};

/**
 * Scanned-invoice extraction. The browser can't hold AWS credentials, so the
 * documents go to the API and come back as ExtractedInvoice[] plus the
 * server-side reconciliation of each invoice against its own printed totals.
 *
 * Deliberately no timeout: both engines read every page of every file before
 * they answer — Bedrock through the model, Textract by polling its async job —
 * and a multi-file batch routinely runs minutes. Cutting it off would throw
 * away an extraction that was going to finish, and that you're already paying
 * for.
 */
export const parseScannedInvoices = async (
  url: string,
  token: string,
  files: File[],
  engine: InvoiceEngine,
  storeid: number,
) => {
  const formData = new FormData();
  // Repeated `files` parts — the endpoint's List[UploadFile] parameter.
  files.forEach((file) => formData.append("files", file));
  // A Form field, not a query param — the endpoint declares it as Form(...).
  // The server re-checks the store against the caller's own assignments before
  // any billable work, so sending one they can't use fails the whole request.
  formData.append("storeid", String(storeid));

  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    url: url + ENGINE_PATHS[engine],
    data: formData,
    timeout: 0,
  });

  return json;
};

export type InvoiceHistoryQuery = {
  /** Omitted entirely = every store the caller can see. */
  storeid?: number;
  engine?: InvoiceEngine;
  status?: InvoiceRunStatus;
  limit?: number;
  offset?: number;
};

/** Previously processed files, newest first — one row per file, so several
 *  rows share a runId when a request carried several. Scoped server-side to
 *  the caller's own stores. Undefined params are dropped by axios, which is
 *  what the endpoint wants: absent means "no filter", not "null". */
export const getInvoiceHistory = async (
  url: string,
  token: string,
  query: InvoiceHistoryQuery = {},
) =>
  axios({
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    url: url + "invoices/history",
    params: query,
  });

/** The archived result.json for a run — the extraction as it was returned.
 *  Only available for runs whose archive write succeeded; the history row's
 *  resultS3Uri says whether there's anything to fetch. */
export const getInvoiceResult = async (
  url: string,
  token: string,
  runId: string,
) =>
  axios({
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    url: `${url}invoices/result/${encodeURIComponent(runId)}`,
  });
