import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setApiEnv } from "@/features/appSlice";
import { useScanGun } from "@/components-dev/scanner/useScanGun";

/*
 * The scan gun is dev mode only: in production the handheld scans through
 * RHC's own scanner, so the field must stay an ordinary input there.
 */

const Field = ({ onScan }: { onScan: (upc: string) => void }) => {
  const gun = useScanGun(onScan);
  return <input ref={gun.ref} data-testid="upc" />;
};

const scanInto = (env: "dev" | "prod") => {
  const store = setupStore();
  store.dispatch(setApiEnv(env));
  const onScan = vi.fn();
  const { getByTestId } = render(
    <Provider store={store}>
      <Field onScan={onScan} />
    </Provider>,
  );
  getByTestId("upc").dispatchEvent(
    new InputEvent("beforeinput", { inputType: "insertText", data: "290003007995", cancelable: true, bubbles: true }),
  );
  return onScan;
};

describe("useScanGun", () => {
  it("takes a scan in dev mode", () => {
    expect(scanInto("dev")).toHaveBeenCalledTimes(1);
  });

  it("ignores it in production mode", () => {
    expect(scanInto("prod")).not.toHaveBeenCalled();
  });
});
