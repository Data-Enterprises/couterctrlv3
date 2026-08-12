export interface InvoiceFile {
  runId: string;
  createdAt: string;
  storeid: number;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  invoiceCount: number;
  reconciledCount: number;
  failedCount: number;
  engine: string;
  modelId: string;
  durationMs: number;
  status: string;
  error: string | null;
  sourceS3Uri: string;
  resultS3Uri: string;
  estCostUsd: string;
}

export interface InvoiceHistoryJsonResp {
  error: number;
  success: boolean;
  msg: string;
  total: number;
  limit: number;
  offset: number;
  files: InvoiceFile[];
}

export interface ResultFile {
  file: string;
  invoics: number;
  pages: number;
  error: string | null;
  sourceKey: string;
  storageError: string | null;
}

export interface ResultInvoice {
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  account: string;
  storeName: string;
  terms: string;
  pages: string;
  lines: {
    description: string;
    itemCode: string;
    qty: number;
    unitPrice: string;
    ext: string;
  }[];
}

export interface InvoiceResult {
  runId: string;
  engine: string;
  storeid: number;
  extractedAt: string;
  extractedBy: string;
  model: string;
  effort: string | null;
  pageCount: number;
  files: ResultFile[];
  invoices: ResultInvoice[];
}

export interface InvoiceResultJsonResp {
  error: number;
  success: boolean;
  msg: string;
  runId: string;
  storeid: string;
  resultS3Uri: string;
  result: InvoiceResult;
}
