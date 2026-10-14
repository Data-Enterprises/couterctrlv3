import { useState } from "react";
import { BackspaceIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import ScannerView from "../../../components-dev/scanner/ScannerView";
import { normalizeUpc } from "../../../components-dev/scanner";
import { useScanGun } from "../../../components-dev/scanner/useScanGun";
import { TY_COLOR } from "../../../components-dev/mobile/perf/perfColors";
import type { ScanSource } from "../../../features/dev/devUpcScannerSlice";
import { isEnterableUpc } from "./upcEntry";

/**
 * Where a UPC gets into the batch.
 *
 * The same row as Performance mobile's "Find an item": the field, one button
 * that changes job with the field's contents, and a clear beside it once there
 * is something to clear. Three ways in, all ending in the same callback:
 *
 *   1. A scan gun. The wedge commits the barcode into whatever is focused, so
 *      the field owns focus and a trigger pull needs no button at all.
 *   2. The camera, opened from the button and closed the same way. It also
 *      closes itself on a read — one tag is one trip to the camera, and
 *      leaving it running over a list you are now reading is just a hot phone.
 *   3. Typing, then the button. The only one that needs a press, because
 *      nothing else can say when a typed code is finished.
 *
 * The camera is offered on every device, gun hardware included. A handheld's
 * own camera is worse than its scanner but it is there, and gating it on the
 * device would mean the one device we can test on could never show it.
 */

interface CaptureCardProps {
  /** Both codes, every time: normalized for the lookup, raw as printed. */
  onScan: (code: string, raw: string, source: ScanSource) => void;
}

const CaptureCard = ({ onScan }: CaptureCardProps) => {
  const [field, setField] = useState("");
  // Closed on arrival: it holds the camera, a decode loop and a chunk of the
  // screen, none of which is wanted by someone who came here to type a code or
  // read back what they have collected.
  const [cameraOpen, setCameraOpen] = useState(false);

  // A scan lands in the visible field first, then becomes a row. That order is
  // deliberate: the clerk sees the digits the scanner actually read before
  // anything is looked up, so a bad read is visible rather than inferred from
  // a list entry.
  const gun = useScanGun((code, raw) => {
    setCameraOpen(false);
    setField(raw);
    onScan(code, raw, "gun");
  });

  const submitTyped = () => {
    const raw = field.trim();
    if (!isEnterableUpc(raw)) return;
    onScan(normalizeUpc(raw), raw, "typed");
    setField("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          id="upc-capture"
          type="text"
          ref={gun.ref}
          inputMode={gun.inputMode ?? "numeric"}
          enterKeyHint="done"
          value={field}
          onChange={(e) => {
            // Typing closes the camera. Someone keying a code has stopped
            // pointing the phone at anything, and the button under their thumb
            // has already turned into the one that adds it.
            setCameraOpen(false);
            setField(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && submitTyped()}
          placeholder="Scan or type a UPC"
          aria-label="UPC"
          className="min-w-0 flex-1 rounded-lg border-0 bg-bkg px-3 py-3 text-[16px] text-content placeholder:text-content/95"
          style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
        />
        {/* One button, two jobs — with an empty field there is nothing to add,
            and with a code in it the camera would only overwrite what was just
            typed. */}
        <button
          type="button"
          onClick={field ? submitTyped : () => setCameraOpen((open) => !open)}
          aria-label={field ? "Add this UPC" : "Scan a barcode"}
          aria-pressed={!field && cameraOpen}
          // The same accent Perf mobile's scan button uses, so the control
          // reads as the same control on both screens.
          className="flex-none rounded-lg px-3 text-custom-white"
          style={{ background: TY_COLOR }}
        >
          {field ? (
            <MagnifyingGlassIcon className="h-[18px] w-[18px]" />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8v8M11 8v8M15 8v8" />
            </svg>
          )}
        </button>
        {field && (
          <button
            type="button"
            onClick={() => setField("")}
            aria-label="Clear"
            className="flex-none rounded-lg bg-bkg px-3 text-content/95"
          >
            <BackspaceIcon className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {cameraOpen && (
        <ScannerView
          onDetected={(code, raw) => {
            // Closes on the read. The code is in the field and in the batch,
            // and what the clerk wants next is to look at the row, not at a
            // live picture of the shelf.
            setCameraOpen(false);
            setField(raw);
            onScan(code, raw, "camera");
          }}
        />
      )}
    </div>
  );
};

export default CaptureCard;
