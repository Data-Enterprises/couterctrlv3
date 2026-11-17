// Interfaces
import type { useExportBuilderCtx } from "../../hooks";

/** Which configuration row is open: a fixed row, or a list by its filter name. */
export type Section = string;

/** The page context, so a section's props can name its fields exactly. */
export type ExportCtx = ReturnType<typeof useExportBuilderCtx>;
