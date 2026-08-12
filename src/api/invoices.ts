import axios from "axios";
import type { InvoiceEngine } from "../interfaces";

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
) => {
  const formData = new FormData();
  // Repeated `files` parts — the endpoint's List[UploadFile] parameter.
  files.forEach((file) => formData.append("files", file));

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
