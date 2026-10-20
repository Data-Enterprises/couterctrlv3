import Quagga from "@ericblade/quagga2";
import { useEffect, useRef, useState } from "react";
import { useMediaDevices } from "react-media-devices";
import { normalizeUpc } from ".";
import { createReadConfirmer, createRepeatGuard } from "./confirmRead";
import "./scannerView.css";

const CONSTRAINTS = {
  video: { facingMode: "environment", width: 1280, height: 720 },
};

/**
 * The band Quagga decodes, as percentages inset from each edge.
 *
 * Reading only the middle keeps a neighbouring barcode on a shelf tag out of
 * the decode. These same numbers draw the on-screen guide below, so the box
 * cannot come to promise a region the decoder is not actually reading — the
 * two were written separately once and the guide ended up about eight percent
 * narrower than the truth.
 */
const AREA = { top: 30, bottom: 30, left: 10, right: 10 };

/**
 * Viewfinder height.
 *
 * It buys more than screen presence: the decode band is the middle 40% of the
 * frame, so this is the one number that sets how tall a barcode can be and
 * still be read. At 175 that band was 70px, which is a tight target held at
 * arm's length over a shelf.
 */
const FRAME_HEIGHT = 220;

/**
 * Why the camera would not start, in the user's terms.
 *
 * The three cases have different fixes — grant a permission, use another
 * device, serve over https — and "could not start the camera" sends someone
 * looking in the wrong place for all three.
 */
const cameraMessage = (err: unknown) => {
  const name = (err as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access is blocked. Allow it for this site, or type the UPC.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError")
    return "No camera found on this device. Type the UPC instead.";
  return "Could not start the camera. Type the UPC instead.";
};

interface Props {
  /**
   * Fires once per confirmed read.
   *
   * Takes the code twice: normalized for a lookup, and the raw decode exactly
   * as it is printed on the tag. `normalizeUpc` drops the check digit and a
   * leading zero, and neither can be put back — so a page that has to show or
   * send the printed code needs the second argument. Callers that only search
   * can ignore it.
   */
  onDetected: (upc: string, raw: string) => void;
  /**
   * Stop the camera on the first confirmed read.
   *
   * The difference between looking something up and collecting a shelf. Item
   * Lookup asks one question and wants the camera off while it answers it; a
   * screen that is building a batch has to stay live, or the clerk reopens the
   * camera fifty times down an aisle.
   */
  stopOnRead?: boolean;
  /** Bump to start the camera again — after a stop, or after a failure. */
  retryKey?: number;
  /**
   * Told why the camera would not start.
   *
   * Passing this also takes responsibility for showing it: the message is not
   * drawn here, so a page with its own error panel does not print it twice.
   */
  onError?: (message: string) => void;
}

/**
 * The camera, and nothing else.
 *
 * It owns no state a page can go stale against: it reads, it reports, and it
 * stops if asked to. Everything a page wants to remember about a scan — the
 * code, whether the camera is paused, which error is showing — belongs to that
 * page, which is why this takes callbacks rather than reaching for a slice.
 * The component it replaced carried its own, and two screens using it would
 * have shared one `upcCode` between them.
 */
const ScannerView = ({ onDetected, stopOnRead = false, retryKey = 0, onError }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  // Both callbacks are read at detection time rather than captured at init, so
  // a re-render between opening the camera and the read cannot leave us
  // dispatching against a stale closure.
  const cb = useRef(onDetected);
  cb.current = onDetected;
  const errCb = useRef(onError);
  errCb.current = onError;

  const { devices } = useMediaDevices({ constraints: CONSTRAINTS });

  useEffect(() => {
    // getUserMedia only exists in a secure context. Over plain http on a LAN
    // address — how a phone reaches a dev server — the API is simply absent,
    // which otherwise surfaces as a silent dead camera.
    if (!navigator.mediaDevices) {
      const message = "The camera needs a secure (https) connection.";
      setError(message);
      errCb.current?.(message);
      return;
    }
    if (!devices || !ref.current) return;

    // Labels are empty strings until the user grants camera permission, so
    // this finds the rear camera on a second visit and comes up empty on the
    // first. Both paths have to work.
    const back = devices.find((d) => /back|rear|environment/i.test(d.label));

    const camera = back
      ? { deviceId: back.deviceId }
      : // A preference, NOT `{ exact: "environment" }`. A laptop has no
        // environment-facing camera, and an exact constraint on one is an
        // OverconstrainedError instead of a fallback — which is why this
        // failed on desktop. Unqualified, a phone still picks its rear
        // camera and a laptop uses the webcam it has.
        { facingMode: "environment" };

    let live = true;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: ref.current,
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            ...camera,
          },
          // Reading only the middle band keeps neighbouring barcodes on a
          // shelf tag out of the decode.
          area: {
            top: `${AREA.top}%`,
            bottom: `${AREA.bottom}%`,
            left: `${AREA.left}%`,
            right: `${AREA.right}%`,
          },
        },
        decoder: {
          readers: ["upc_reader", "upc_e_reader", "ean_reader", "ean_8_reader"],
        },
        locate: true,
      },
      (err) => {
        if (!live) return;
        if (err) {
          const message = cameraMessage(err);
          setError(message);
          errCb.current?.(message);
          return;
        }
        setError("");
        Quagga.start();
      },
    );

    // Two guards between a decode and the page, both per camera session:
    // confirm it is a real read, then that it is not the same code again. See
    // confirmRead — one frame is not a read, and a code left in the guide
    // re-confirms a few frames later, which only shows up on a screen that
    // keeps scanning.
    const confirm = createReadConfirmer();
    const accept = createRepeatGuard();
    Quagga.onDetected((result) => {
      const code = confirm(result);
      if (!code || !accept(code)) return;
      if (stopOnRead) {
        Quagga.stop();
        Quagga.offDetected();
      }
      cb.current(normalizeUpc(code), code);
    });

    return () => {
      live = false;
      Quagga.offDetected();
      // stop() throws if init never completed — a denied camera permission
      // being the common case, which is not an error worth surfacing twice.
      try {
        Quagga.stop();
      } catch {
        /* never started */
      }
    };
  }, [devices, retryKey, stopOnRead]);

  // A page that took the error takes the whole job: it decides what to show
  // and where, so nothing is drawn here.
  const showError = error.length > 0 && !onError;

  return (
    <div>
      {/* Kept mounted but collapsed on failure: Quagga needs the target node
          to exist at init, and a black rectangle under an error message reads
          as a camera that is on and pointed at nothing. */}
      <div
        className="relative w-full overflow-hidden rounded-xl bg-content"
        style={{ height: showError ? 0 : FRAME_HEIGHT }}
      >
        <div ref={ref} className="scanner-container absolute inset-0" />
        {/* Where to hold the barcode. Clients line the code up against this,
            which is most of why a scan lands on the first try rather than the
            third — it is worth more than it looks. Inset from the same AREA
            the decoder reads, so it is a true mask rather than a rough guide. */}
        {!showError && (
          <>
            <div
              className="pointer-events-none absolute rounded-md"
              style={{
                top: `${AREA.top}%`,
                bottom: `${AREA.bottom}%`,
                left: `${AREA.left}%`,
                right: `${AREA.right}%`,
                border: "2px solid #6ee7b7",
              }}
            />
            {/* Inside the frame, over the picture: on a small screen a caption
                underneath costs a line of height the viewfinder wants more. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-custom-white/95">
                Hold the barcode inside the frame
              </span>
            </div>
          </>
        )}
      </div>
      {showError && <p className="text-center text-[11.5px] text-content/95">{error}</p>}
    </div>
  );
};

export default ScannerView;
