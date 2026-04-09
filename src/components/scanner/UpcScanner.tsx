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
  containerClassName?: string;
  handleScan: () => void;
  onClear: () => void;
  isFiltering?: boolean;
  handleFilter?: () => void;
  totalItems?: number;
  setUpcSearch?: (value: string) => void;
}

const UpcScanner = ({
  handleScan,
  onClear,
  containerClassName = "",
  isFiltering = false,
  handleFilter,
  totalItems,
  setUpcSearch = () => {},
}: UpcScannerProps) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const state = useAppSelector((state) => state.itemScan);

  const constraints = {
    video: { facingMode: "environment", width: 1280, height: 720 },
  };
  const { devices } = useMediaDevices({ constraints });

  useEffect(() => {
    return () => {
      Quagga.stop();
      Quagga.offDetected();
      dispatch(setPause(true));
    };
  }, []);

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
        if (isFiltering && handleFilter) {
          handleFilter();
        } else {
          handleScan();
        }
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
        if (isFiltering && handleFilter) {
          handleFilter();
        } else {
          handleScan();
        }
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
    // if (onClear) onClear();
    dispatch(setError(""));
    dispatch(setPause(true));
  };

  const handleUpcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpcSearch(e.target.value);
    dispatch(setUpcCode(e.target.value));
  };

  return (
    <div className={containerClassName}>
      <div
        ref={ref}
        className={`scanner-container ${
          state.pause ? "hidden" : "block"
        } mb-2 rounded-lg`}
        style={{ objectFit: "cover", height: "175px", width: "100%" }}
      />
      <div className="text-[13px] font-medium">
        Search item {totalItems ? `- ${totalItems}` : ""}
      </div>
      <div className="flex gap-1 items-center">
        <input
          type="text"
          data-testid="scan-item-input"
          value={state.upcCode}
          onChange={handleUpcChange}
          className="basic-input bg-custom-white py-1.5 text-[13.5px]"
        />
        <button
          data-testid="scan-button"
          onClick={scanItem}
          className="btn-themeGreen px-4 py-1.5 text-[13.5px]"
        >
          Search
        </button>
        <button
          data-testid="scan-button"
          onClick={onClear}
          className="btn-themeOrange px-4 py-1.5 text-[13.5px]"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default UpcScanner;
