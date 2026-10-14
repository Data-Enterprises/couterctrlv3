import { useAppSelector } from "../../../hooks";
import UpcScannerMobile from "./UpcScannerMobile";

/**
 * Upc Scanner is a handheld page, and only a handheld page.
 *
 * There is no `mobile: false` equivalent for "mobile only" — `mobile` in the
 * nav drives the phone's page list, and the route in `main.tsx` is registered
 * either way — so the desktop branch is this notice rather than a second
 * build of the screen. Scanning needs a scanner: a desktop with neither a
 * wedge nor a usable camera has nothing to offer here, and a cut-down version
 * would only invite someone to type UPCs by hand, which is the thing this page
 * exists to stop.
 */
const UpcScanner = () => {
  const isMobile = useAppSelector((s) => s.app.isMobile);
  if (isMobile) return <UpcScannerMobile />;

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col items-center justify-center gap-2 px-4 text-center">
      <div className="text-sm font-semibold text-content/85">
        Open this one on the handheld
      </div>
      <div className="max-w-xs text-xs text-content/85">
        Upc Scanner collects shelf-tag barcodes with a scan gun or a phone
        camera, so it runs on the device doing the scanning.
      </div>
    </div>
  );
};

export default UpcScanner;
