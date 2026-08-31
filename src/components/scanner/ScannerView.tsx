import Quagga from "@ericblade/quagga2";
import { useEffect, useRef, useState } from "react";
import { useMediaDevices } from "react-media-devices";
import { normalizeUpc } from ".";

const CONSTRAINTS = {
  video: { facingMode: "environment", width: 1280, height: 720 },
};

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
  /** Fires once per read, with the code already normalized. */
  onDetected: (upc: string) => void;
}

/**
 * The camera, and nothing else.
 *
 * UpcScanner bundles the viewfinder with its own input, Search and Clear
 * buttons and its own `itemScanSlice` — which is why pages using it end up
 * with two search fields, and why a second scan re-fires the first code:
 * `upcCode` survives the read, so the button takes the "already have a code"
 * branch instead of reopening the camera.
 *
 * This owns no state a page can go stale against. It reads, it reports, it
 * stops. The page decides what the code means.
 */
const ScannerView = ({ onDetected }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  // The callback is read at detection time rather than captured at init, so a
  // re-render between opening the camera and the read cannot leave us
  // dispatching against a stale closure.
  const cb = useRef(onDetected);
  cb.current = onDetected;

  const { devices } = useMediaDevices({ constraints: CONSTRAINTS });

  useEffect(() => {
    // getUserMedia only exists in a secure context. Over plain http on a LAN
    // address — how a phone reaches a dev server — the API is simply absent,
    // which otherwise surfaces as a silent dead camera.
    if (!navigator.mediaDevices) {
      setError("The camera needs a secure (https) connection.");
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
          area: { top: "30%", bottom: "30%", left: "10%", right: "10%" },
        },
        decoder: {
          readers: ["upc_reader", "upc_e_reader", "ean_reader", "ean_8_reader"],
        },
        locate: true,
      },
      (err) => {
        if (!live) return;
        if (err) {
          setError(cameraMessage(err));
          return;
        }
        setError("");
        Quagga.start();
      },
    );

    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      if (!code) return;
      cb.current(normalizeUpc(code));
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
  }, [devices]);

  return (
    <div>
      {/* Kept mounted but collapsed on failure: Quagga needs the target node
          to exist at init, and a black rectangle under an error message reads
          as a camera that is on and pointed at nothing. */}
      <div
        ref={ref}
        className="scanner-container overflow-hidden rounded-lg bg-content"
        style={{
          objectFit: "cover",
          height: error ? 0 : 175,
          width: "100%",
        }}
      />
      <p
        className={`text-center text-[11.5px] text-content/85 ${error ? "" : "pt-1.5"}`}
      >
        {error || "Hold the barcode inside the frame."}
      </p>
    </div>
  );
};

export default ScannerView;
