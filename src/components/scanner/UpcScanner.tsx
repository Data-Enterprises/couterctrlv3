import Quagga from "@ericblade/quagga2";
import { useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useMediaDevices } from "react-media-devices";
import {
  setDeviceId,
  setError,
  setPause,
  setUpcCode,
} from "../../features/itemScanSlice";

interface UpcScannerProps {
  handleUpcChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleScan: () => void;
  onClear?: () => void;
}

const UpcScanner = ({
  handleUpcChange,
  handleScan,
  onClear,
}: UpcScannerProps) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const state = useAppSelector((state) => state.itemScan);

  const constraints = {
    video: { facingMode: "environment", width: 1280, height: 720 },
  };
  const { devices } = useMediaDevices({ constraints });

  useEffect(() => {
    if (devices) {
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment") ||
          device.label.toLowerCase().includes("rear"),
      );

      const selectedDeviceId = backCamera
        ? backCamera.deviceId
        : devices[1].deviceId;
      dispatch(setDeviceId(selectedDeviceId));
    }
  }, [devices]);

  const scanItem = () => {
    if (ref.current) {
      if (state.upcCode.length) {
        // run the passed in scan item function here
        handleScan();
        return;
      }

      // Otherwise, we start the scanner,
      // get the upc code and then call the scan item function passed in

      if (ref.current.style.display === "block") {
        ref.current.style.display = "none";
        stopScanner();
        return;
      }

      ref.current.style.display = "block";

      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: ref.current!,
            constraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: { exact: "environment" },
              deviceId: state.deviceId,
            },
          },
          decoder: {
            readers: [
              "upc_reader",
              "upc_e_reader",
              "ean_reader",
              "ean_8_reader",
            ],
          },
          locate: true,
        },
        (err) => {
          if (!err) {
            Quagga.start();
            dispatch(setPause(false));
          }
        },
      );

      Quagga.onDetected((result) => {
        Quagga.stop();
        Quagga.offDetected();

        ref.current!.style.display = "none";
        const code = result.codeResult.code;
        dispatch(setUpcCode(code!));
        // Run the passed in scan item function here with the scanned upc code
        // selectedStore > 0 ? getSingleStoreData(code!) : getData(code!);
        handleScan();
        dispatch(setPause(true));
      });
    }
  };

  const stopScanner = () => {
    if (!state.pause) {
      clear();
      return;
    }

    dispatch(setError(""));
    Quagga.stop();
    Quagga.offDetected();
    dispatch(setPause(false));
  };

  const clear = () => {
    if (onClear) onClear(); // pass the below dispatch from ItemLookup.tsx as onClose
    // dispatch(resetLookupSlice());
    dispatch(setError(""));
    dispatch(setPause(true));
  };

  return (
    <div>
      <div
        ref={ref}
        className={`scanner-container ${
          state.pause ? "hidden" : "block"
        } mb-2 rounded-lg`}
        style={{ objectFit: "cover", height: "175px", width: "100%" }}
      />
      <div className="text-sm font-medium">Scan item:</div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          data-testid="scan-item-input"
          value={state.upcCode}
          onChange={handleUpcChange}
          className="basic-input bg-custom-white"
        />
        <button
          data-testid="scan-button"
          onClick={scanItem}
          className="btn-themeBlue px-4"
        >
          Scan
        </button>
      </div>
    </div>
  );
};

export default UpcScanner;
