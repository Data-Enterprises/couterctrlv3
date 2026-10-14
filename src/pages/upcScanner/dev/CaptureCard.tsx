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
    // No card of its own: the capture sits inside the scope card, under the
    // store it is scanning for. They were two cards saying one thing.
    //
    // No label above the field either. On a handheld the field IS the scanner
    // and its placeholder already says what to do — a caption over it is a line
    // of small grey text earning nothing on a screen this size.
    <div className="flex flex-col gap-2">
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
            <span className="text-[10.5px] text-content/95">or type it</span>
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
          placeholder={isGun ? "Pull the trigger" : "Type a UPC"}
          aria-label="UPC"
          className="basic-input bg-brand_paper h-12 min-w-0 flex-1 font-mono text-[19px] tracking-wider text-content"
        />
        {/* Always there, so typing a code has a visible destination — it just
            does nothing until there is a code to add. A trigger pull never
            needs it: the scan is in the batch before the digits appear here. */}
        <button
          type="button"
          onClick={submitTyped}
          disabled={!ENTERABLE.test(field.trim())}
          className="h-12 shrink-0 rounded-lg bg-brand_navy px-5 text-[16px] font-bold text-custom-white disabled:bg-brand_navy/20 disabled:text-content/40"
        >
          Add
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            isGun ? "bg-severity_healthy_text" : "bg-brand_navy"
          }`}
        />
        <span className="text-[13px] font-semibold text-content">
          {isGun ? "Ready to scan" : "Camera on"}
        </span>
      </div>
    </div>
  );
};

export default CaptureCard;
