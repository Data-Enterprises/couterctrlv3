import Quagga from "@ericblade/quagga2";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useMediaDevices } from "react-media-devices";
import {
  setDeviceId,
  setError,
  setPause,
  setUpcCode,
} from "../../../features/itemScanSlice";
import { normalizeUpc } from "../../../components/scanner";
import "./dev-scanner.css";

interface DevUpcScannerProps {
  handleScan: (upc: string) => void;
  retryKey: number;
}

const DevUpcScanner = ({ handleScan, retryKey }: DevUpcScannerProps) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const state = useAppSelector((s) => s.itemScan);

  const constraints = {
    video: { facingMode: "environment", width: 1280, height: 720 },
  };
  const { devices } = useMediaDevices({ constraints });

  useEffect(() => {
    if (devices) {
      const backCamera = devices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("environment") ||
          d.label.toLowerCase().includes("rear"),
      );
      const selectedDeviceId = backCamera ? backCamera.deviceId : devices[1]?.deviceId;
      if (selectedDeviceId) dispatch(setDeviceId(selectedDeviceId));
    }
  }, [devices]);

  // Scans continuously the moment a camera is available -- restarts whenever
  // retryKey bumps (the "try scanning again" recovery action), not on every
  // pause change, so a successful decode doesn't immediately re-trigger itself.
  useEffect(() => {
    if (!ref.current || !state.deviceId) return;
    dispatch(setError(""));

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: ref.current,
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: { exact: "environment" },
            deviceId: state.deviceId,
          },
          area: {
            top: "30%",
            bottom: "30%",
            left: "10%",
            right: "10%",
          },
        },
        decoder: {
          readers: ["upc_reader", "upc_e_reader", "ean_reader", "ean_8_reader"],
        },
        locate: true,
      },
      (err) => {
        if (!err) {
          Quagga.start();
          dispatch(setPause(false));
        } else {
          dispatch(setError("Couldn't access the camera. Enter the code below instead."));
        }
      },
    );

    Quagga.onDetected((result) => {
      Quagga.stop();
      Quagga.offDetected();
      const code = result.codeResult.code;
      const normalized = code ? normalizeUpc(code) : "";
      dispatch(setUpcCode(normalized));
      dispatch(setPause(true));
      handleScan(normalized);
    });

    return () => {
      Quagga.stop();
      Quagga.offDetected();
    };
  }, [state.deviceId, retryKey]);

  return (
    <div style={{ position: "relative", background: "#1a1a1a", borderRadius: 12, height: 200, overflow: "hidden" }}>
      <div ref={ref} className="dev-scanner-container" style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "72%",
          height: 78,
          border: "2px solid #6ee7b7",
          borderRadius: 8,
          pointerEvents: "none",
        }}
      />
      <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[11px] text-white/75">Scanning for a barcode</span>
      </div>
    </div>
  );
};

export default DevUpcScanner;
