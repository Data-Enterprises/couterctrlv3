import { decodeRecord } from "./fixedWidth";
import type {
  FileSpec,
  ParsedRecord,
  ParseResult,
  ParseWarning,
} from "./types";

/**
 * A fixed-width file into records, driven entirely by the supplied spec.
 *
 * Nothing here branches on a vendor. Point it at a different `FileSpec` and it
 * reads a different format — which is the whole reason schemas are config.
 *
 * **Nothing throws.** A file with three malformed lines should still show the
 * other four hundred, because a person needs to see what *did* parse in order
 * to judge whether the failures matter. Problems are collected as warnings and
 * surfaced; unknown record types keep their raw line so nothing is discarded on
 * the way through.
 *
 * The caller must read the file as **ISO-8859-1**, not UTF-8. A multi-byte
 * sequence shifts every column after it and silently corrupts the whole record.
 */
export const parseFixedWidth = (text: string, spec: FileSpec): ParseResult => {
  const records: ParsedRecord[] = [];
  const warnings: ParseWarning[] = [];
  const countsByType: Record<string, number> = {};

  text.split(/\r?\n/).forEach((line, index) => {
    // Trailing newline at end of file, not a record.
    if (line === "") return;

    const lineNumber = index + 1;
    const recordType = line.slice(0, spec.recordTypeLength);
    const schema = spec.schemas[recordType];

    if (line.length !== spec.recordLength) {
      warnings.push({
        lineNumber,
        recordType,
        message: `expected ${spec.recordLength} characters, got ${line.length}`,
      });
    }

    if (schema) {
      records.push({
        recordType,
        lineNumber,
        known: true,
        fields: decodeRecord(line, schema),
        raw: line,
      });
    } else {
      warnings.push({
        lineNumber,
        recordType,
        message: `unknown record type '${recordType}'`,
      });
      records.push({
        recordType,
        lineNumber,
        known: false,
        fields: {},
        raw: line,
      });
    }

    countsByType[recordType] = (countsByType[recordType] ?? 0) + 1;
  });

  return { records, warnings, countsByType };
};
