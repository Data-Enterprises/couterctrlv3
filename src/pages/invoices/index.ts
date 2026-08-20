import type { ColDef } from "ag-grid-community";
import type {
  ExtractedInvoice,
  ExtractedInvoiceLine,
  InvoiceEngine,
  InvoiceReconciliation,
  ParseScannedJsonResp,
} from "../../interfaces";
import type { InvoiceParseResult } from "./invoiceParsingSlice";

/** Per-engine media types, mirroring the endpoint's `_media_type` and its
 *  TEXTRACT_MEDIA_TYPES gate. The two sets overlap but neither contains the
 *  other: Bedrock reads GIF and WebP, Textract reads TIFF. */
const ENGINE_MEDIA_TYPES: Record<InvoiceEngine, string[]> = {
  bedrock: [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ],
  textract: ["application/pdf", "image/png", "image/jpeg", "image/tiff"],
};

const ENGINE_EXTENSIONS: Record<InvoiceEngine, string[]> = {
  bedrock: [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
  textract: [".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff"],
};

export const ENGINES: {
  id: InvoiceEngine;
  label: string;
  blurb: string;
  fileTypes: string;
}[] = [
  {
    id: "bedrock",
    label: "Claude",
    blurb:
      "Layout-agnostic. Handles any vendor without setup and splits a batch PDF on its own. Costs more per page and runs longer.",
    fileTypes: "PDF, PNG, JPEG, GIF or WebP",
  },
  {
    id: "textract",
    label: "Textract",
    blurb:
      "Purpose-built OCR. Cheaper and faster, but reports the fields it recognises — reconciliation is how you tell whether it read this vendor's layout.",
    fileTypes: "PDF, PNG, JPEG or TIFF",
  },
];

/** Everything either engine can read, so switching engines never means picking
 *  the files again. Per-engine support is checked separately. */
export const ACCEPT_ATTR = [
  ...new Set([
    ...ENGINE_EXTENSIONS.bedrock,
    ...ENGINE_EXTENSIONS.textract,
    ...ENGINE_MEDIA_TYPES.bedrock,
    ...ENGINE_MEDIA_TYPES.textract,
  ]),
].join(",");

/** Mirrors the endpoint's `_media_type`: trust the declared content type, fall
 *  back to the extension when the browser doesn't set one. */
const matches = (file: File, engine: InvoiceEngine): boolean => {
  const declared = (file.type || "").split(";")[0].trim().toLowerCase();
  if (ENGINE_MEDIA_TYPES[engine].includes(declared)) return true;
  const name = (file.name || "").toLowerCase();
  return ENGINE_EXTENSIONS[engine].some((ext) => name.endsWith(ext));
};

/** Readable by the selected engine. Checking here is a courtesy that saves an
 *  upload — the server runs the same check and its answer is the authoritative
 *  one, so anything that slips through comes back as a per-file error rather
 *  than a surprise. */
export const isSupportedFile = (file: File, engine: InvoiceEngine): boolean =>
  matches(file, engine);

/** Readable by *either* engine. Staging is gated on this rather than on the
 *  selected engine, so a TIFF picked under Claude survives the switch to
 *  Textract instead of being thrown away at the moment it becomes useful. */
export const isStageableFile = (file: File): boolean =>
  matches(file, "bedrock") || matches(file, "textract");

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Two files picked in separate trips through the dialog can carry the same
 *  name and size; that's a genuine duplicate for our purposes and the server
 *  would only overwrite one archive key with the other. */
export const dedupeFiles = (existing: File[], incoming: File[]): File[] => {
  const key = (f: File) => `${f.name}__${f.size}`;
  const seen = new Set(existing.map(key));
  return [
    ...existing,
    ...incoming.filter((f) => {
      if (seen.has(key(f))) return false;
      seen.add(key(f));
      return true;
    }),
  ];
};

/** How one file is doing in a bulk run. `canceled` is a file whose request was
 *  dropped before an answer came back — the server may well have read it
 *  anyway, so History is the authority on what it cost. */
export type BulkFileStatus =
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "canceled";

export type BulkFileProgress = {
  /** Name only — enough to render, and it keeps the File itself out of the
   *  render path where a stale reference would pin the whole upload alive. */
  file: string;
  status: BulkFileStatus;
  invoices: number;
  error?: string;
};

/** Axios reports anything that never reached the server as the bare string
 *  "Network Error", which covers two very different situations: the API being
 *  unreachable, and the browser failing to read a staged file off disk — what
 *  a file that was moved, renamed or re-saved after being dropped looks like
 *  from here. Neither is worth printing as-is next to a file name. */
export const readableError = (err: unknown): string => {
  const message =
    (err as { message?: string } | null)?.message ?? "The request failed.";
  return message === "Network Error"
    ? "Never left the browser — either the file couldn't be read from disk (moved or renamed since it was dropped?) or the API was unreachable"
    : message;
};

/** A parse response as the page stores it. Engine and store are echoed by the
 *  server; the ones we asked with stand in when they aren't. */
export const toParseResult = (
  j: ParseScannedJsonResp,
  engine: InvoiceEngine,
  storeid: number,
): InvoiceParseResult => ({
  runIds: j.runId ? [j.runId] : [],
  runEngine: j.engine ?? engine,
  runStoreid: j.storeid ?? storeid,
  model: j.model ?? null,
  pageCount: j.pageCount ?? null,
  estCostUsd: j.estCostUsd ?? null,
  runArchived: false,
  runExtractedAt: null,
  runExtractedBy: null,
  invoices: j.invoices ?? [],
  reconciliation: j.reconciliation ?? [],
  files: j.files ?? [],
  storage: j.storage ?? null,
});

/** Folds the runs of a bulk batch into the single result the page renders.
 *
 *  `invoices` and `reconciliation` are concatenated run by run, which keeps
 *  the positional pairing pairInvoices depends on: each run's two arrays stay
 *  adjacent and in order, so the merged pair aligns exactly when every run's
 *  did.
 *
 *  Pages and cost are all-or-nothing. A run that reports neither has still
 *  been billed for something we can't see, and quietly summing the rest would
 *  print a total that reads as the batch's when it isn't. */
export const mergeRunResults = (
  runs: InvoiceParseResult[],
): InvoiceParseResult => ({
  runIds: runs.flatMap((r) => r.runIds),
  runEngine: runs[0]?.runEngine ?? null,
  runStoreid: runs[0]?.runStoreid ?? null,
  // Every run in a batch goes to the same engine, so any model id they report
  // is the batch's; take the first that has one.
  model: runs.find((r) => r.model !== null)?.model ?? null,
  pageCount: runs.every((r) => r.pageCount !== null)
    ? runs.reduce((sum, r) => sum + (r.pageCount ?? 0), 0)
    : null,
  estCostUsd:
    runs.length > 0 && runs.every((r) => r.estCostUsd !== null)
      ? runs.reduce((sum, r) => sum + Number(r.estCostUsd), 0).toFixed(4)
      : null,
  runArchived: false,
  runExtractedAt: null,
  runExtractedBy: null,
  invoices: runs.flatMap((r) => r.invoices),
  reconciliation: runs.flatMap((r) => r.reconciliation),
  files: runs.flatMap((r) => r.files),
  // Every run of a batch writes under its own prefix. The bar shows one as a
  // starting point; the per-run keys are what the archive is actually indexed
  // by, and history holds those.
  storage: runs.find((r) => r.storage !== null)?.storage ?? null,
});

export type InvoiceRow = {
  invoice: ExtractedInvoice;
  /** Absent only if the server's two arrays disagreed — see pairInvoices. */
  reconciliation?: InvoiceReconciliation;
  /** Index into the response's `invoices`, which is what selection stores. */
  index: number;
};

/** `invoices` and `reconciliation` are appended in the same server-side loop,
 *  one check entry per accepted invoice, so position is the reliable link. It
 *  has to be: the invoice payload carries no file name of its own, and two
 *  files in one batch can print the same invoice number. The number match is
 *  only a fallback for the case where the two arrays come back different
 *  lengths, and it accepts an ambiguous match rather than showing nothing. */
export const pairInvoices = (
  invoices: ExtractedInvoice[],
  reconciliation: InvoiceReconciliation[],
): InvoiceRow[] =>
  invoices.map((invoice, index) => {
    const aligned =
      reconciliation.length === invoices.length
        ? reconciliation[index]
        : reconciliation.find((r) => r.invoiceNumber === invoice.invoiceNumber);
    return { invoice, reconciliation: aligned, index };
  });

/** Money is displayed exactly as the invoice printed it. A blank field means
 *  the invoice didn't show one, which is different from zero. */
export const printed = (value?: string | number | null): string =>
  value === undefined || value === null || value === "" ? "—" : String(value);

/** True for an amount the model transcribed with a leading minus — credits,
 *  returns and parenthesized amounts, which read wrong in the same colour as
 *  everything else. */
export const isNegative = (value?: string): boolean =>
  typeof value === "string" && value.trim().startsWith("-");

export const lineCount = (invoice: ExtractedInvoice): number =>
  invoice.lines?.length ?? 0;

/** One flat row per line item across the whole run, so an export carries the
 *  invoice it came from. Every amount stays a string — see the note on
 *  ExtractedInvoiceLine. */
export type InvoiceLineExportRow = {
  invoiceNumber: string;
  invoiceDate: string;
  vendor: string;
  file: string;
  pages: string;
  reconciled: string;
  itemCode: string;
  upc: string;
  description: string;
  pack: string;
  size: string;
  qty: string;
  unitPrice: string;
  allowance: string;
  ext: string;
};

const cell = (value?: string | number | null): string =>
  value === undefined || value === null ? "" : String(value);

export const buildLineExportRows = (
  rows: InvoiceRow[],
): InvoiceLineExportRow[] =>
  rows.flatMap(({ invoice, reconciliation }) =>
    (invoice.lines ?? []).map((line: ExtractedInvoiceLine) => ({
      invoiceNumber: cell(invoice.invoiceNumber),
      invoiceDate: cell(invoice.invoiceDate),
      vendor: cell(invoice.vendor),
      file: cell(reconciliation?.file),
      pages: cell(invoice.pages),
      reconciled:
        reconciliation === undefined ? "" : reconciliation.reconciled ? "Yes" : "No",
      itemCode: cell(line.itemCode),
      upc: cell(line.upc),
      description: cell(line.description),
      pack: cell(line.pack),
      size: cell(line.size),
      qty: cell(line.qty),
      unitPrice: cell(line.unitPrice),
      allowance: cell(line.allowance),
      ext: cell(line.ext),
    })),
  );

export const lineExportCols: ColDef<InvoiceLineExportRow>[] = [
  { headerName: "Invoice", field: "invoiceNumber" },
  { headerName: "Invoice Date", field: "invoiceDate" },
  { headerName: "Vendor", field: "vendor" },
  { headerName: "File", field: "file" },
  { headerName: "Pages", field: "pages" },
  { headerName: "Reconciled", field: "reconciled" },
  { headerName: "Item Code", field: "itemCode" },
  { headerName: "UPC", field: "upc" },
  { headerName: "Description", field: "description" },
  { headerName: "Pack", field: "pack" },
  { headerName: "Size", field: "size" },
  { headerName: "Qty", field: "qty" },
  { headerName: "Unit Price", field: "unitPrice" },
  { headerName: "Allowance", field: "allowance" },
  { headerName: "Ext", field: "ext" },
];
