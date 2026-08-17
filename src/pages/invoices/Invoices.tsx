import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setInvoicesError,
  setInvoicesResult,
  setInvoicesParsing,
} from "../../features/invoicesSlice";
import InvoicesEntry from "./InvoicesEntry";
import InvoiceListPanel from "./InvoiceListPanel";
import InvoiceDetailPanel from "./InvoiceDetailPanel";
import { parseAwgFile } from "./vendors/awg";
import { presentInvoices } from "./present";

/**
 * Invoices — a vendor's electronic invoice file, decoded and checked.
 *
 * The page owns the read, the way every other page owns its fetch. Parsing is
 * local and synchronous, so there is no loading state worth showing; what there
 * is instead is a failure state, because a file in the wrong format produces
 * nothing rather than something wrong.
 *
 * Entry card is full-page until a file has been read, then the two-panel view
 * takes over and re-reading happens in a modal — the same flow as every other
 * page that starts from a search.
 */
const Invoices = () => {
  const dispatch = useAppDispatch();
  const rows = useAppSelector((s) => s.invoices.rows);
  const error = useAppSelector((s) => s.invoices.error);
  const [searchOpen, setSearchOpen] = useState(false);

  // Escape closes the re-read overlay. The page behind it is still readable, so
  // an overlay you can only leave by aiming at a button is the wrong trade.
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const handleFile = (text: string, fileName: string) => {
    dispatch(setInvoicesParsing(true));
    try {
      const parsed = parseAwgFile(text);
      if (parsed.invoices.length === 0) {
        // Nothing recognisable. Almost always the wrong file rather than an
        // empty one, so the message says so instead of showing a blank list.
        dispatch(
          setInvoicesError(
            "No invoices found in that file. It doesn't look like an AWG electronic invoice file.",
          ),
        );
        return;
      }
      dispatch(
        setInvoicesResult({
          fileName,
          rows: presentInvoices(parsed.invoices, parsed.reconciliation),
          warnings: parsed.warnings,
          countsByType: parsed.countsByType,
          allReconciled: parsed.allReconciled,
        }),
      );
      setSearchOpen(false);
    } catch (e) {
      // A decode error names the field it failed on, which is the one thing
      // that makes a malformed file diagnosable.
      dispatch(
        setInvoicesError(
          e instanceof Error ? e.message : "Could not read that file",
        ),
      );
    }
  };

  if (rows.length === 0) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        <InvoicesEntry onFile={handleFile} error={error} />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <InvoiceListPanel onSearchOpen={() => setSearchOpen(true)} />
        <InvoiceDetailPanel />
      </div>

      {/* The card itself, on a dimmed page — not wrapped in the generic modal
          shell, which boxes a 560px card inside its own narrower frame and
          leaves the card's full-page centring to stretch the result. */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/35 p-4"
          onMouseDown={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-[560px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <InvoicesEntry
              onFile={handleFile}
              error={error}
              onClose={() => setSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
