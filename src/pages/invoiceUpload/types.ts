/**
 * Shapes returned by goliath's /invoices endpoints.
 *
 * Mirrors `models/invoice.py` (ExtractedInvoice) and the run payload built in
 * `routers/invoices.py`. Money stays the printed string the server sends —
 * nothing on this page does arithmetic on it, so there is nothing to parse.
 */

export interface ExtractedLine {
  description: string;
  itemCode?: string;
  upc?: string;
  /** Cases billed, for an AWG file. */
  qty: number;
  /** Case cost, for an AWG file. */
  unitPrice?: string;
  allowance?: string;
  ext: string;
}

export interface ExtractedTotals {
  subtotal?: string;
  discount?: string;
  deposit?: string;
  credits?: string;
  serviceFee?: string;
  invoiceTotal: string;
}

export interface ExtractedInvoice {
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  account?: string;
  storeName?: string;
  storeNumber?: string;
  terms?: string;
  pages?: string;
  lines: ExtractedLine[];
  totals: ExtractedTotals;
}

export interface ReconcileCheck {
  label: string;
  derived: string;
  reported: string;
  ok: boolean;
}

export interface InvoiceReconciliation {
  invoiceNumber: string;
  file: string;
  reconciled: boolean;
  checks: ReconcileCheck[];
}

export interface FileWarning {
  lineNumber?: number;
  recordType?: string;
  message: string;
}

export interface FileReport {
  file: string;
  invoices: number;
  pages: number | null;
  error: string | null;
  sourceKey: string | null;
  storageError: string | null;
  /** EDI only, and only when the file decoded. */
  records?: number;
  recordsByType?: Record<string, number>;
  warningCount?: number;
  warnings?: FileWarning[];
  storeNumbers?: string[];
}

/**
 * What the page renders — the fields a fresh parse and an archived
 * result.json have in common, so a run reopened from history looks exactly
 * like the upload that produced it.
 */
export interface InvoiceRun {
  runId: string;
  engine: string;
  storeid: number;
  invoices: ExtractedInvoice[];
  /** Parallel to `invoices`: the server appends one entry per accepted
   *  invoice, in the same order. */
  reconciliation: InvoiceReconciliation[];
  files: FileReport[];
}

export interface ParseResponse extends InvoiceRun {
  error: number;
  success: boolean;
  msg: string;
  pageCount: number;
  estCostUsd: string | null;
  storage: {
    bucket: string;
    prefix: string;
    resultKey: string | null;
    error: string | null;
  };
  model: string;
}

export interface HistoryFile {
  runId: string;
  createdAt: string;
  storeid: number;
  fileName: string | null;
  fileSizeBytes: number | null;
  pageCount: number | null;
  invoiceCount: number;
  reconciledCount: number;
  failedCount: number;
  engine: string;
  modelId: string;
  durationMs: number | null;
  status: string;
  error: string | null;
  sourceS3Uri: string | null;
  resultS3Uri: string | null;
  estCostUsd: string | null;
}

export interface HistoryResponse {
  error: number;
  success: boolean;
  msg: string;
  total: number;
  limit: number;
  offset: number;
  files: HistoryFile[];
}

export interface ResultResponse {
  error: number;
  success: boolean;
  msg: string;
  runId: string;
  storeid: number;
  resultS3Uri: string;
  result: InvoiceRun;
}
