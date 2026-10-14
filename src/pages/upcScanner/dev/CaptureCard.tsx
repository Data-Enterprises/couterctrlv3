import { useState } from "react";
import ScannerView from "../../../components-dev/scanner/ScannerView";
import { normalizeUpc } from "../../../components-dev/scanner";
import {
  useIsScanGunDevice,
  useScanGun,
} from "../../../components-dev/scanner/useScanGun";
import type { ScanSource } from "../../../features/dev/devUpcScannerSlice";

/**
 * Where a UPC gets into the batch. One card, two faces, the device picks.
 *
 * On scan-gun hardware the capture is a focused text field: the wedge commits
 * the barcode into whatever is focused, so a field that owns focus *is* the
 * scanner, and there is no viewfinder to show. On a phone with no gun the same
 * slot holds the camera, live, with a small typed field under it — the
 * camera's own failure messages all end in "type the UPC instead", so
 * something has to be there when they fire.
 *
 * Both faces stay armed for as long as the screen is open. The gun's field is
 * always ready, so the camera is too: opening it per item is unworkable at
 * fifty tags.
 *
 * It sits directly under the scope card and never at the foot of the list —
 * adding an item is how you get anywhere on this screen, so it has to be
 * reachable without scrolling past everything already scanned.
 */

/** The same shape a wedge scan has to have: digits only, 8 through 14. */
const ENTERABLE = /^\d{8,14}$/;

interface CaptureCardProps {
  /** Both codes, every time: normalized for the lookup, raw as printed. */
  onScan: (code: string, raw: string, source: ScanSource) => void;
}

const CaptureCard = ({ onScan }: CaptureCardProps) => {
  const isGun = useIsScanGunDevice();
  const [field, setField] = useState("");

  // A scan lands in the visible field first, then becomes a row. That order is
  // deliberate: the clerk sees the digits the scanner actually read before
  // anything is looked up, so a bad read is visible rather than inferred from
  // a list entry. The code stays in the field afterwards until the next scan
  // replaces it.
  const gun = useScanGun((code, raw) => {
    setField(raw);
    onScan(code, raw, "gun");
  });

  const submitTyped = () => {
    const raw = field.trim();
    if (!ENTERABLE.test(raw)) return;
    onScan(normalizeUpc(raw), raw, "typed");
    setField("");
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-custom-white shadow-md p-3 flex flex-col gap-2">
      <label
        htmlFor="upc-capture"
        className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85"
      >
        {isGun ? "Scan or type a UPC" : "Scan a barcode"}
      </label>

      {!isGun && (
        <>
          <ScannerView
            onDetected={(code, raw) => {
              setField(raw);
              onScan(code, raw, "camera");
            }}
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-content/15" />
            <span className="text-[10.5px] text-content/85">or type it</span>
            <div className="flex-1 h-px bg-content/15" />
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <input
          id="upc-capture"
          type="text"
          ref={gun.ref}
          inputMode={gun.inputMode ?? "numeric"}
          value={field}
          onChange={(e) => setField(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitTyped()}
          placeholder={isGun ? "Pull the trigger…" : "UPC"}
          aria-label="UPC"
          className={`basic-input bg-brand_paper min-w-0 flex-1 font-mono tracking-wider text-content ${
            isGun ? "h-12 text-[17px]" : "h-10 text-[15px]"
          }`}
        />
        <button
          type="button"
          onClick={submitTyped}
          disabled={!ENTERABLE.test(field.trim())}
          className="h-10 shrink-0 rounded-lg bg-brand_navy px-4 text-[13px] font-semibold text-custom-white disabled:bg-brand_navy/20 disabled:text-content/40"
        >
          Add
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={`h-[7px] w-[7px] shrink-0 rounded-full ${
            isGun ? "bg-severity_healthy_text" : "bg-brand_navy"
          }`}
        />
        <span className="text-[11px] font-semibold text-content/85">
          {isGun ? "Scanner armed" : "Camera on"}
        </span>
        <span className="text-[11px] text-content/85">
          {isGun ? "— tap the field if it stops reading" : "— hold the tag in the frame"}
        </span>
      </div>
    </section>
  );
};

export default CaptureCard;
